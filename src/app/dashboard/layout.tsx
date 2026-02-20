import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black text-white pl-64">
            <Sidebar />
            <main className="min-h-screen">
                {children}
            </main>
        </div>
    );
}
