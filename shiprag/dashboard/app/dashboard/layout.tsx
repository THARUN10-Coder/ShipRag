import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { RepositoryProvider } from "@/context/repository-context";
import { ConnectRepositoryModal } from "@/components/dashboard/connect-repository-modal";
import { CommandMenu } from "@/components/ui/command-menu";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RepositoryProvider>
      <div className="min-h-screen bg-[#FFFAF3] text-[#211c1d] flex selection:bg-[#FFE5BF] selection:text-[#F62440]">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-[240px] flex flex-col min-w-0 transition-all duration-300">
          <DashboardHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Global Command Palette & Onboarding Modal */}
        <CommandMenu />
        <ConnectRepositoryModal />
      </div>
    </RepositoryProvider>
  );
}

