import StefanLayout from "@/components/StefanLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { JARODEVIL_SIGNATURE_URL } from "@/lib/brandSignature";
import { FileText, Loader2, Upload, Download, Printer, FileCheck } from "lucide-react";
import { useState, useRef } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import mammoth from "mammoth";

export default function Analysis() {
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState("");
  const [analysis, setAnalysis] = useState("");
  const analysisRef = useRef<HTMLDivElement>(null);

  const analyzeMutation = trpc.analysis.analyzeDocument.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setAnalysis(data.analysis);
        toast.success("Analiza zakończona pomyślnie");
      } else {
        toast.error("Błąd analizy", { description: data.analysis });
      }
    },
    onError: (error) => {
      toast.error("Błąd połączenia", { description: error.message });
    },
  });

  const analyzePDFMutation = trpc.analysis.analyzePDFWithGemini.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setAnalysis(data.analysis);
        toast.success("Analiza PDF zakończona pomyślnie");
      } else {
        toast.error("Błąd analizy PDF", { description: data.analysis });
      }
    },
    onError: (error) => {
      toast.error("Błąd połączenia", { description: error.message });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);

    // Sprawdzenie typu pliku
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileExtension === "docx";
    const isPdf = file.type === "application/pdf" || fileExtension === "pdf";

    if (isPdf) {
      try {
        toast.info("Wysyłam plik PDF do analizy...");
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );

        // Call Gemini multimodal API directly
        analyzePDFMutation.mutate({
          fileData: base64,
          filename: file.name,
          mimeType: "application/pdf",
        });
      } catch (error) {
        console.error("PDF upload error:", error);
        toast.error("Nie udało się przesłać pliku PDF", {
          description: "Spróbuj ponownie lub użyj innego pliku."
        });
      }
    } else if (isDocx) {
      try {
        toast.info("Przetwarzam plik DOCX...");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        if (!result.value.trim()) {
          toast.error("DOCX nie zawiera tekstu");
          return;
        }
        
        setContent(result.value.trim());
        toast.success(`Plik DOCX "${file.name}" został wczytany`);
        
        // Ostrzegaj o problemach z konwersją (jeśli są)
        if (result.messages.length > 0) {
          console.warn("DOCX conversion warnings:", result.messages);
        }
      } catch (error) {
        console.error("DOCX parsing error:", error);
        toast.error("Nie udało się przetworzyć pliku DOCX", {
          description: "Spróbuj wyeksportować DOCX jako tekst lub użyj innego pliku."
        });
      }
    } else {
      // Plain text file
      try {
        const text = await file.text();
        if (!text.trim()) {
          toast.error("Plik jest pusty");
          return;
        }
        setContent(text.trim());
        toast.success(`Plik "${file.name}" został wczytany`);
      } catch (error) {
        console.error("Text file reading error:", error);
        toast.error("Nie udało się odczytać pliku tekstowego");
      }
    }
  };

  const handleAnalyze = () => {
    if (!content.trim()) {
      toast.error("Brak treści do analizy", {
        description: "Wklej tekst lub prześlij plik dokumentu."
      });
      return;
    }

    analyzeMutation.mutate({
      content: content.trim(),
      filename,
    });
  };

  const handleExportPDF = () => {
    if (!analysis) {
      toast.error("Brak analizy do eksportu");
      return;
    }

    // Create a simple text export (browser print dialog)
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      toast.error("Nie udało się otworzyć okna drukowania");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Analiza Dokumentu - ${filename || 'Dokument'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #333; }
            pre { white-space: pre-wrap; word-wrap: break-word; }
            .signature { margin-top: 28px; padding-top: 12px; border-top: 1px solid #ddd; display: flex; align-items: center; gap: 10px; font-size: 10px; color: #666; }
            .signature img { max-height: 28px; max-width: 120px; object-fit: contain; }
          </style>
        </head>
        <body>
          <h1>Analiza Dokumentu</h1>
          <p><strong>Plik:</strong> ${filename || 'Bez nazwy'}</p>
          <hr />
          <pre>${analysis}</pre>
          <div class="signature"><img src="${JARODEVIL_SIGNATURE_URL}" alt="Sygnatura Jaro'Devil" /><span>Jaro&apos;Devil — Pasternak Jarek | System Stefan v5.8 | Wygenerowano: ${new Date().toLocaleString("pl-PL")}</span></div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const isLoading = analyzeMutation.isPending || analyzePDFMutation.isPending;

  return (
    <StefanLayout>
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Analiza Dokumentów</h1>
          <p className="text-muted-foreground">
            Prześlij dokument (PDF, DOCX, TXT) lub wklej tekst do analizy prawnej
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Dokument do Analizy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Prześlij plik
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Wybierz plik (PDF, DOCX, TXT)
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                {filename && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Wybrany plik: <span className="font-medium">{filename}</span>
                  </p>
                )}
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Lub wklej tekst
                </label>
                <Textarea
                  placeholder="Wklej tutaj treść dokumentu do analizy..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  disabled={isLoading}
                />
              </div>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={isLoading || !content.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analizuję...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 mr-2" />
                    Analizuj Dokument
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Analysis Result Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Wynik Analizy
                </span>
                {analysis && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPDF}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Drukuj
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={analysisRef}
                className="min-h-[400px] prose prose-sm max-w-none dark:prose-invert"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : analysis ? (
                  <Streamdown>{analysis}</Streamdown>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground">
                    <FileText className="w-16 h-16 mb-4 opacity-20" />
                    <p>Prześlij dokument lub wklej tekst, a następnie kliknij "Analizuj Dokument"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StefanLayout>
  );
}
