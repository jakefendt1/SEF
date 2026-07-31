// AIM Glide ROI Calculator — Main Page
// Design: Executive Dashboard — Dieter Rams-inspired Functionalism
// Accessibility: WCAG AA+, keyboard nav, screen reader support, touch-optimized

import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IntraloxLogo } from './IntraloxLogo';
import { CalculatorTab } from './CalculatorTab';
import { ResultsTab } from './ResultsTab';
import { useCalculator } from '@/hooks/useCalculator';
import { generatePDF } from '@/lib/pdf-export';
import { toast } from 'sonner';
import {
  Calculator,
  BarChart3,
  FileDown,
  Save,
  FolderOpen,
  RotateCcw,
  MoreVertical,
  Check,
} from 'lucide-react';

export function AimGlideHome() {
  const calc = useCalculator();
  const [activeTab, setActiveTab] = useState('calculator');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [overwriteInfo, setOverwriteInfo] = useState<{ name: string; index: number } | null>(null);

  const handleExportPDF = useCallback(() => {
    try {
      generatePDF(calc.inputs, calc.tco, calc.benefitYears);
      toast.success('PDF exported successfully');
    } catch (err) {
      toast.error('Failed to export PDF');
      console.error(err);
    }
  }, [calc.inputs, calc.tco, calc.benefitYears]);

  const handleSave = useCallback(() => {
    const result = calc.saveCalculation();
    if (result && 'needsConfirm' in result && result.needsConfirm) {
      setOverwriteInfo({ name: result.name!, index: result.existingIndex! });
      setOverwriteDialogOpen(true);
    } else {
      toast.success(`Saved: ${result?.name}`);
    }
  }, [calc]);

  const handleConfirmOverwrite = useCallback(() => {
    if (overwriteInfo) {
      calc.confirmSaveOverwrite(overwriteInfo.name, overwriteInfo.index);
      toast.success(`Updated: ${overwriteInfo.name}`);
    }
    setOverwriteDialogOpen(false);
    setOverwriteInfo(null);
  }, [calc, overwriteInfo]);

  const handleClear = useCallback(() => {
    calc.clearAllInputs();
    setClearDialogOpen(false);
    toast('All inputs cleared', {
      action: {
        label: 'Undo',
        onClick: () => calc.handleUndo(),
      },
    });
  }, [calc]);

  return (
    <>
      {/* Skip to content link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b" role="banner">
          <div className="container flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3 sm:gap-4">
              <IntraloxLogo />
              <div className="h-6 w-px bg-border hidden sm:block" aria-hidden="true" />
              <div className="flex flex-col">
                <h1 className="text-sm sm:text-base font-semibold text-foreground leading-tight">
                  AIM Glide ROI Calculator
                </h1>
                {calc.inputs.customerName && (
                  <p className="text-[11px] text-muted-foreground truncate max-w-[200px] sm:max-w-none">
                    {calc.inputs.customerName}
                    {calc.inputs.projectName ? ` — ${calc.inputs.projectName}` : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 no-print">
              {/* Auto-save indicator */}
              {calc.dataSaved && (
                <span className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1">
                  <Check className="size-3 text-savings-green" aria-hidden="true" />
                  Saved
                </span>
              )}

              {/* Desktop action buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-9">
                  <FileDown className="size-4" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleSave} className="h-9">
                  <Save className="size-4" />
                  Save
                </Button>
              </div>

              {/* Mobile + Desktop overflow menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" aria-label="More actions">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleExportPDF} className="sm:hidden">
                    <FileDown className="size-4" />
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSave} className="sm:hidden">
                    <Save className="size-4" />
                    Save Calculation
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="sm:hidden" />

                  {/* Saved Calculations */}
                  {calc.savedCalculations.length > 0 && (
                    <>
                      {calc.savedCalculations.map((sc) => (
                        <DropdownMenuItem key={sc.name} onClick={() => {
                          calc.loadCalculation(sc);
                          toast.success(`Loaded: ${sc.name}`);
                        }}>
                          <FolderOpen className="size-4" />
                          {sc.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem onClick={() => setClearDialogOpen(true)}>
                    <RotateCcw className="size-4" />
                    Clear All Inputs
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className="flex-1 container py-5 sm:py-8" role="main">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 sm:h-11 max-w-md mx-auto">
              <TabsTrigger value="calculator" className="gap-2 text-sm h-10 sm:h-9 min-h-[44px]">
                <Calculator className="size-4" aria-hidden="true" />
                Calculator
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2 text-sm h-10 sm:h-9 min-h-[44px]">
                <BarChart3 className="size-4" aria-hidden="true" />
                Results & ROI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calculator" className="mt-0">
              <CalculatorTab
                inputs={calc.inputs}
                onChange={calc.handleInputChange}
                addNote={calc.addNote}
                updateNote={calc.updateNote}
                removeNote={calc.removeNote}
              />
            </TabsContent>

            <TabsContent value="results" className="mt-0">
              <ResultsTab
                tco={calc.tco}
                inputs={calc.inputs}
                benefitYears={calc.benefitYears}
                onBenefitYearsChange={calc.setBenefitYears}
              />
            </TabsContent>
          </Tabs>
        </main>

        {/* Footer */}
        <footer className="border-t py-4 no-print" role="contentinfo">
          <div className="container">
            <p className="text-xs text-muted-foreground text-center">
              Intralox AIM Glide ROI Calculator v9 — For internal use only
            </p>
          </div>
        </footer>
      </div>

      {/* Clear All Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Inputs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all fields to zero. You can undo this action immediately after clearing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Overwrite Save Dialog */}
      <AlertDialog open={overwriteDialogOpen} onOpenChange={setOverwriteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite Saved Calculation?</AlertDialogTitle>
            <AlertDialogDescription>
              A calculation named "{overwriteInfo?.name}" already exists. Do you want to overwrite it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOverwrite}>
              Overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
