import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black text-white pl-0 md:pl-64 pt-16 md:pt-0">
            <Sidebar />
            <main className="min-h-screen">
                {children}
            </main>
        </div>
    );
}
