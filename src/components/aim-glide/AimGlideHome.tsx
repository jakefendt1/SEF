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
import { CalculatorTab } from './CalculatorTab';
import { ResultsTab } from './ResultsTab';
import { SavedCalculationsTab } from './SavedCalculationsTab';
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
  Lightbulb,
} from 'lucide-react';

export function AimGlideHome() {
  const calc = useCalculator();
  const [activeTab, setActiveTab] = useState('calculator');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [exampleDialogOpen, setExampleDialogOpen] = useState(false);
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

  const handleLoadExample = useCallback(() => {
    calc.loadExampleInputs();
    setExampleDialogOpen(false);
    toast('Example numbers loaded — replace them with the real ones', {
      action: {
        label: 'Undo',
        onClick: () => calc.handleUndo(),
      },
    });
  }, [calc]);

  return (
    <>
      <div className="flex flex-col bg-background">
        {/* Page toolbar. Deliberately not sticky and not a <header> -- the app
            shell already owns the sticky header and the back navigation. */}
        <div className="border-b bg-card no-print">
          <div className="container flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground leading-tight">
                AIM Glide ROI Calculator
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                {calc.inputs.customerName
                  ? `${calc.inputs.customerName}${calc.inputs.projectName ? ` — ${calc.inputs.projectName}` : ''}`
                  : 'Untitled calculation'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {calc.dataSaved && (
                <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                  <Check className="size-4 text-savings-green" aria-hidden="true" />
                  Saved
                </span>
              )}

              <div className="hidden sm:flex items-center gap-2">
                <Button variant="outline" onClick={handleExportPDF} className="min-h-[44px]">
                  <FileDown className="size-4" />
                  Export PDF
                </Button>
                <Button variant="outline" onClick={handleSave} className="min-h-[44px]">
                  <Save className="size-4" />
                  Save
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11"
                    aria-label="More actions"
                  >
                    <MoreVertical className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuItem onClick={handleExportPDF} className="sm:hidden">
                    <FileDown className="size-4" />
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSave} className="sm:hidden">
                    <Save className="size-4" />
                    Save calculation
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="sm:hidden" />

                  <DropdownMenuItem onClick={() => setActiveTab('saved')}>
                    <FolderOpen className="size-4" />
                    Saved calculations
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => setExampleDialogOpen(true)}>
                    <Lightbulb className="size-4" />
                    Load example values
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setClearDialogOpen(true)}>
                    <RotateCcw className="size-4" />
                    Clear all inputs
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="flex-1 container py-5 sm:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 h-14 max-w-xl mx-auto">
              <TabsTrigger value="calculator" className="gap-2 text-base min-h-[48px]">
                <Calculator className="size-4" aria-hidden="true" />
                Calculator
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2 text-base min-h-[48px]">
                <BarChart3 className="size-4" aria-hidden="true" />
                Results
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-2 text-base min-h-[48px]">
                <FolderOpen className="size-4" aria-hidden="true" />
                Saved
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

            <TabsContent value="saved" className="mt-0">
              <SavedCalculationsTab
                calculations={calc.calculations}
                onLoad={(id) => {
                  if (!calc.loadCalculationById(id)) return;
                  setActiveTab('calculator');
                  toast('Opened', {
                    action: { label: 'Undo', onClick: () => calc.handleUndo() },
                  });
                }}
                onRename={(id, name) => {
                  calc.renameCalculation(id, name);
                  toast.success('Renamed');
                }}
                onDuplicate={(id) => {
                  calc.duplicateCalculation(id);
                  toast.success('Copy created');
                }}
                onDelete={(id) => {
                  calc.deleteCalculation(id);
                  toast.success('Deleted');
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        <footer className="border-t py-4 no-print">
          <div className="container">
            <p className="text-xs text-muted-foreground text-center">
              Intralox AIM Glide ROI Calculator — For internal use only
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

      {/* Load Example Values Dialog */}
      <AlertDialog open={exampleDialogOpen} onOpenChange={setExampleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Load example values?</AlertDialogTitle>
            <AlertDialogDescription>
              This fills every number with made-up figures from a sample bakery line, so you can see
              how the calculator works. Replace them with the customer's real numbers before you save
              or export anything.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoadExample}>Load examples</AlertDialogAction>
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
