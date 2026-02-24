import { ChatGroq } from "@langchain/groq";
import { StateGraph, MessagesAnnotation, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { createAgentTools } from "./tools";
import { buildSystemPrompt } from "./prompts";
import type { ChatMessage } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a compiled LangGraph agent for the Neural Link.
 * The agent can reason, call tools, and stream responses.
 */
export function createNeuralLinkAgent(
  userId: string,
  integrity: number,
  supabase: SupabaseClient,
) {
  const tools = createAgentTools(userId, supabase);

  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL_ID || "llama-3.1-8b-instant",
    temperature: 0.7,
    maxTokens: 2048,
  }).bindTools(tools);

  const toolNode = new ToolNode(tools);

  // The agent node: calls the LLM with the current messages
  async function agentNode(state: typeof MessagesAnnotation.State) {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
  }

  // Conditional edge: should we continue to tools or end?
  function shouldContinue(state: typeof MessagesAnnotation.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    // If the LLM returned tool calls, route to the tools node
    if (
      lastMessage &&
      "tool_calls" in lastMessage &&
      Array.isArray(lastMessage.tool_calls) &&
      lastMessage.tool_calls.length > 0
    ) {
      return "tools";
    }
    // Otherwise we're done
    return END;
  }

  // Build the graph
  const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldContinue, {
      tools: "tools",
      [END]: END,
    })
    .addEdge("tools", "agent");

  const app = graph.compile();

  return { app, systemPrompt: buildSystemPrompt(integrity) };
}

/**
 * Convert our ChatMessage history to LangChain message format.
 */
export function convertHistory(
  history: ChatMessage[],
  systemPrompt: string,
): BaseMessage[] {
  const messages: BaseMessage[] = [new SystemMessage(systemPrompt)];

  for (const msg of history) {
    if (msg.sender === "user") {
      messages.push(new HumanMessage(msg.text));
    } else {
      messages.push(new AIMessage(msg.text));
    }
  }

  return messages;
}
