'use client';

import { WizardSidebar } from '@/components/dashboard/wizard-sidebar';
import { WizardTopbar } from '@/components/dashboard/wizard-topbar';
import { ProgramWizardProvider } from '@/lib/program-wizard-context';

export default function CreateProgramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProgramWizardProvider>
      <div className="min-h-screen bg-[#0e0e0e] text-white">
        <WizardTopbar />
        <WizardSidebar />
        <main className="ml-64 pt-16 min-h-screen">
          {children}
        </main>
      </div>
    </ProgramWizardProvider>
  );
}
