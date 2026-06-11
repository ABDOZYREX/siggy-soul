import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Check, Download, Share2, Signature, Sparkles } from "lucide-react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { ritualTestnet } from "@/lib/wagmi";
import { toast } from "sonner";

const PAPER_SRC = "/signature-paper.png";
const PAYMENT_AMOUNT = "0.0001";

const SIGNATURE_BOX = {
  left: 57.4,
  top: 80.1,
  width: 25.8,
  height: 10.3,
};

const SIGNATURE_NAME_BOX = {
  left: 54.2,
  top: 73.4,
  width: 33.2,
};

function getSignatureSnapshot(canvas: HTMLCanvasElement | null) {
  if (!canvas) return null;

  const scratch = document.createElement("canvas");
  scratch.width = canvas.width;
  scratch.height = canvas.height;

  const scratchContext = scratch.getContext("2d");
  if (!scratchContext) return null;

  scratchContext.drawImage(canvas, 0, 0);
  const pixels = scratchContext.getImageData(0, 0, scratch.width, scratch.height).data;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] > 0) {
      return scratch.toDataURL("image/png");
    }
  }

  return null;
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("Unable to export canvas"));
    }, "image/png");
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image"));
    image.src = src;
  });
}

let paperPreloadPromise: Promise<HTMLImageElement> | null = null;

function preloadPaperImage() {
  paperPreloadPromise ??= loadImage(PAPER_SRC);
  return paperPreloadPromise;
}

export function SignatureDialog() {
  const { address, isConnected } = useAccount();
  const { sendTransaction, isPending: isSending } = useSendTransaction();

  const [open, setOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [confirmedName, setConfirmedName] = useState("");
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [paymentHash, setPaymentHash] = useState<`0x${string}` | undefined>(undefined);
  const [paperLoaded, setPaperLoaded] = useState(false);
  const [sealedPreviewUrl, setSealedPreviewUrl] = useState<string | null>(null);
  const [signatureSnapshotUrl, setSignatureSnapshotUrl] = useState<string | null>(null);
  const [isBuildingPreview, setIsBuildingPreview] = useState(false);

  const { isLoading: isConfirmingPayment, isSuccess: isPaymentConfirmed } =
    useWaitForTransactionReceipt({ hash: paymentHash });

  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const nameConfirmed = confirmedName.length > 0;
  const signatureReady = hasDrawnSignature;
  const ritualReady = nameConfirmed && signatureReady;
  const ritualSealed = isPaymentConfirmed;

  useEffect(() => {
    let cancelled = false;

    void preloadPaperImage()
      .then(() => {
        if (!cancelled) {
          setPaperLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Paper preview failed to load.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open || !paperLoaded) return;
    const frame = window.requestAnimationFrame(() => {
      const canvas = drawCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));

      const context = canvas.getContext("2d");
      if (!context) return;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2.2;
      context.strokeStyle = "rgba(18, 40, 28, 0.95)";
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, paperLoaded]);

  useEffect(() => {
    if (!ritualSealed) return;
    toast.success("Ritual confirmed. You can now download or share your contract.");
  }, [ritualSealed]);

  useEffect(() => {
    if (!open || !ritualSealed) return;

    let cancelled = false;
    setIsBuildingPreview(true);

    void buildExportCanvas()
      .then((canvas) => {
        if (cancelled) return;
        setSealedPreviewUrl(canvas.toDataURL("image/png"));
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Preview generation failed.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsBuildingPreview(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, ritualSealed]);

  const clearCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2.2;
    context.strokeStyle = "rgba(18, 40, 28, 0.95)";
  };

  const clearSignature = () => {
    clearCanvas();
    setHasDrawnSignature(false);
    setPaymentHash(undefined);
    setSealedPreviewUrl(null);
    setSignatureSnapshotUrl(null);
  };

  const resetAll = () => {
    setNameInput("");
    setConfirmedName("");
    setSealedPreviewUrl(null);
    setIsBuildingPreview(false);
    clearSignature();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetAll();
    }
  };

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!nameConfirmed || ritualSealed) return;

    const canvas = drawCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const point = getPoint(event);
    drawingRef.current = true;
    lastPointRef.current = point;

    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    setHasDrawnSignature(true);
    setPaymentHash(undefined);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || ritualSealed) return;

    const canvas = drawCanvasRef.current;
    const context = canvas?.getContext("2d");
    const previousPoint = lastPointRef.current;
    if (!canvas || !context || !previousPoint) return;

    const point = getPoint(event);
    context.beginPath();
    context.moveTo(previousPoint.x, previousPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPointRef.current = point;
  };

  const finishStroke = (event?: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    syncSignatureSnapshot();
    if (event) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const confirmName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      toast.error("Write your name first.");
      return;
    }

    setConfirmedName(trimmed.slice(0, 32));
    setPaymentHash(undefined);
    toast.success("Name confirmed. You can now sign the contract.");
  };

  const changeName = () => {
    setConfirmedName("");
    setPaymentHash(undefined);
  };

  const syncSignatureSnapshot = () => {
    setSignatureSnapshotUrl(getSignatureSnapshot(drawCanvasRef.current));
  };

  const buildExportCanvas = async () => {
    const paper = await preloadPaperImage();
    const canvas = document.createElement("canvas");
    canvas.width = paper.naturalWidth;
    canvas.height = paper.naturalHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to create export context");
    }

    context.drawImage(paper, 0, 0, canvas.width, canvas.height);

    const signX = canvas.width * (SIGNATURE_BOX.left / 100);
    const signY = canvas.height * (SIGNATURE_BOX.top / 100);
    const signWidth = canvas.width * (SIGNATURE_BOX.width / 100);
    const signHeight = canvas.height * (SIGNATURE_BOX.height / 100);
    const nameX = canvas.width * ((SIGNATURE_NAME_BOX.left + SIGNATURE_NAME_BOX.width / 2) / 100);
    const nameY = canvas.height * (SIGNATURE_NAME_BOX.top / 100);
    const nameWidth = canvas.width * (SIGNATURE_NAME_BOX.width / 100);

    context.fillStyle = "rgba(35, 45, 38, 0.88)";
    context.textAlign = "center";
    context.font = `700 ${Math.round(canvas.width * 0.038)}px "Courier New", monospace`;
    context.fillText(
      confirmedName.toUpperCase(),
      nameX,
      nameY,
      nameWidth,
    );

    context.strokeStyle = "rgba(70, 70, 70, 0.45)";
    context.setLineDash([8, 6]);
    context.strokeRect(signX, signY, signWidth, signHeight);
    context.setLineDash([]);
    context.fillStyle = "rgba(44, 170, 92, 0.92)";
    context.font = `700 ${Math.round(canvas.width * 0.0115)}px "Courier New", monospace`;
    context.fillText("SIGN HERE", nameX, nameY + canvas.height * 0.022, nameWidth);

    if (signatureSnapshotUrl) {
      const signatureImage = await loadImage(signatureSnapshotUrl);
      context.drawImage(signatureImage, signX, signY, signWidth, signHeight);
    } else if (hasDrawnSignature && drawCanvasRef.current) {
      context.drawImage(drawCanvasRef.current, signX, signY, signWidth, signHeight);
    }

    return canvas;
  };

  const downloadDeclaration = async () => {
    if (!ritualSealed) return;
    try {
      const canvas = await buildExportCanvas();
      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${confirmedName || "siggy"}_siggy_soul_signature.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed.");
    }
  };

  const shareDeclaration = async () => {
    if (!ritualSealed) return;

    const shareText = `I sealed my Siggy Soul contract on Ritual Testnet as ${confirmedName}.`;
    const sharePage =
      typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
    const xIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(sharePage)}`;

    window.open(xIntent, "_blank", "noopener,noreferrer");
  };

  const submitRitual = () => {
    if (!nameConfirmed) {
      toast.error("Confirm your name first.");
      return;
    }

    if (!signatureReady) {
      toast.error("Add your signature first.");
      return;
    }

    if (!isConnected || !address) {
      toast.error("Connect your wallet first.");
      return;
    }

    sendTransaction(
      {
        to: address,
        value: parseEther(PAYMENT_AMOUNT),
        chainId: ritualTestnet.id,
      },
      {
        onSuccess: (hash) => {
          setPaymentHash(hash);
          toast.success("Wallet confirmation opened. Approve the 0.0001 transaction to seal your contract.");
        },
        onError: (error) => {
          toast.error(error.message.split("\n")[0] ?? "Transaction failed.");
        },
      },
    );
  };

  const paymentLabel = () => {
    if (ritualSealed) return "RITUAL SEALED";
    if (isSending) return "CHECK WALLET...";
    if (isConfirmingPayment) return "CONFIRMING...";
    return `CONFIRM ${PAYMENT_AMOUNT}`;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="justify-self-center w-full max-w-[200px] px-3 py-2 font-mono-tech text-[10px] uppercase tracking-[0.22em] whitespace-nowrap text-primary border border-primary/60 bg-background/40 transition-colors hover:bg-primary/10 sm:w-auto sm:max-w-none sm:px-5 sm:text-xs sm:tracking-[0.38em]"
        style={{
          boxShadow:
            "0 0 12px oklch(0.78 0.22 145 / 0.32), inset 0 0 18px oklch(0.78 0.22 145 / 0.08)",
        }}
      >
        <span className="inline-flex items-center gap-2">
          <Signature className="h-4 w-4" />
          Signature
        </span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-[1100px] overflow-y-auto border-primary/60 bg-background/95 px-6 py-6 text-primary sm:px-8">
          {ritualSealed ? (
            <div className="relative mt-2 overflow-hidden pb-2">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,oklch(0.78_0.22_145_/_0.24),transparent_58%)] opacity-80 blur-3xl" />
              <DialogHeader className="space-y-2 text-center">
                <DialogTitle className="font-display text-3xl tracking-[0.24em] text-primary text-glow sm:text-5xl">
                  SOUL CONTRACT
                </DialogTitle>
                <DialogDescription className="mx-auto max-w-3xl font-mono-tech text-[10px] tracking-[0.22em] text-primary/70 sm:text-sm">
                  The pact is sealed—your soul now belongs to Siggy
                </DialogDescription>
              </DialogHeader>

              <div className="relative mt-5 flex justify-center">
                <div
                  className="absolute inset-x-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl"
                  style={{ animation: "pulse 1.8s ease-in-out infinite" }}
                />

                <div
                  className="relative w-full max-w-[500px] rounded-[28px] border border-primary/35 bg-background/70 p-3 shadow-[0_0_60px_oklch(0.78_0.22_145_/_0.28)] intro-fade-up"
                  style={{ animationDuration: "700ms" }}
                >
                  {isBuildingPreview ? (
                    <div className="flex min-h-[480px] flex-col items-center justify-center gap-4 text-center">
                      <Sparkles className="h-10 w-10 animate-pulse text-primary" />
                      <p className="font-mono-tech text-sm tracking-[0.28em] text-primary/78">
                        PREPARING SEALED IMAGE...
                      </p>
                    </div>
                  ) : (
                    <img
                      src={sealedPreviewUrl ?? PAPER_SRC}
                      alt="Sealed Siggy Soul contract"
                      className="mx-auto block h-auto w-full max-w-[440px]"
                    />
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={shareDeclaration}
                  disabled={!sealedPreviewUrl}
                  className="inline-flex min-w-[210px] items-center justify-center gap-3 border border-primary bg-primary px-6 py-4 font-display text-lg tracking-[0.24em] text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Share2 className="h-5 w-5" />
                  SHARE ON X
                </button>
                <button
                  type="button"
                  onClick={downloadDeclaration}
                  disabled={!sealedPreviewUrl}
                  className="inline-flex min-w-[210px] items-center justify-center gap-3 border border-primary/60 bg-transparent px-6 py-4 font-display text-lg tracking-[0.24em] text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Download className="h-5 w-5" />
                  DOWNLOAD
                </button>
              </div>

              <div className="mt-4 text-center font-mono-tech text-[11px] tracking-[0.2em] text-primary/72">
                <span className="inline-flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" />
                  SOUL CONTRACT FOR {confirmedName.toUpperCase()}
                </span>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader className="space-y-2 text-center">
                <DialogTitle className="font-display text-4xl tracking-[0.28em] text-primary text-glow">
                  SIGNATURE
                </DialogTitle>
              </DialogHeader>

              <div className="mt-6 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
                <section className="space-y-5">
                  {!nameConfirmed ? (
                    <div className="space-y-3">
                      <label className="block text-center font-mono-tech text-xs tracking-[0.35em] text-primary/80">
                        ADD YOUR NAME
                      </label>
                      <Input
                        value={nameInput}
                        onChange={(event) => {
                          setNameInput(event.target.value);
                          setPaymentHash(undefined);
                        }}
                        maxLength={32}
                        className="h-12 border-primary/60 bg-background/60 text-center font-mono-tech text-lg tracking-[0.2em] text-primary placeholder:text-primary/35 focus-visible:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={confirmName}
                        className="w-full border border-primary bg-primary px-4 py-3 font-display text-lg tracking-[0.28em] text-background transition-opacity hover:opacity-90"
                      >
                        CONFIRM
                      </button>
                    </div>
                  ) : (
                    <div className="border border-primary/40 bg-primary/8 p-4 text-center">
                      <p className="font-mono-tech text-[11px] tracking-[0.35em] text-primary/65">NAME CONFIRMED</p>
                      <p className="mt-2 font-display text-2xl tracking-[0.18em] text-primary">{confirmedName}</p>
                      <button
                        type="button"
                        onClick={changeName}
                        className="mt-3 text-xs font-mono-tech tracking-[0.28em] text-primary/80 transition-opacity hover:opacity-80"
                      >
                        CHANGE NAME
                      </button>
                    </div>
                  )}

                  <div className={`space-y-4 ${!nameConfirmed ? "opacity-45" : ""}`}>
                    <div className="space-y-3 border border-primary/30 bg-background/50 p-4">
                      <p className="font-mono-tech text-[11px] leading-6 tracking-[0.24em] text-primary/72">
                        1. Confirm your name.
                        <br />
                        2. Sign inside the paper box.
                        <br />
                        3. Approve the {PAYMENT_AMOUNT} ritual transaction.
                        <br />
                        4. Download or share your contract.
                      </p>

                      <button
                        type="button"
                        onClick={submitRitual}
                        disabled={!ritualReady || isSending || isConfirmingPayment}
                        className="w-full border border-primary bg-primary px-4 py-3 font-display text-lg tracking-[0.24em] text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {paymentLabel()}
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center justify-center gap-2 border border-primary/20 bg-primary/10 px-3 py-3 font-mono-tech text-xs tracking-[0.24em] text-primary/35 opacity-60"
                        >
                          <Download className="h-4 w-4" />
                          DOWNLOAD
                        </button>
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center justify-center gap-2 border border-primary/20 px-3 py-3 font-mono-tech text-xs tracking-[0.24em] text-primary/35 opacity-60"
                        >
                          <Share2 className="h-4 w-4" />
                          SHARE
                        </button>
                      </div>

                      <div className="min-h-[48px] text-center font-mono-tech text-[11px] tracking-[0.18em] text-primary/70">
                        {isConnected && "A 0.0001 self-confirmation transaction will open in your wallet."}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="flex items-start justify-center">
                  <div className="w-full max-w-[560px] rounded-sm border border-primary/25 bg-background/35 p-4 shadow-[0_0_38px_oklch(0.78_0.22_145_/_0.18)]">
                    <div className="relative mx-auto w-full max-w-[440px]">
                      <img
                        src={PAPER_SRC}
                        alt="Siggy Soul contract paper"
                        fetchPriority="high"
                        loading="eager"
                        decoding="async"
                        onLoad={() => setPaperLoaded(true)}
                        className="block w-full h-auto"
                      />

                      <div className="absolute inset-0">
                        {nameConfirmed && (
                          <div
                            className="pointer-events-none absolute text-center"
                            style={{
                              left: `${SIGNATURE_NAME_BOX.left}%`,
                              top: `${SIGNATURE_NAME_BOX.top}%`,
                              width: `${SIGNATURE_NAME_BOX.width}%`,
                            }}
                          >
                            <p className="font-display text-[18px] font-semibold tracking-[0.12em] text-zinc-700 sm:text-[24px]">
                              {confirmedName.toUpperCase()}
                            </p>
                            <p className="mt-1 whitespace-nowrap font-mono-tech text-[8px] font-bold tracking-[0.28em] text-green-600 sm:text-[10px]">
                              SIGN HERE
                            </p>
                          </div>
                        )}

                        {!nameConfirmed && (
                          <div
                            className="pointer-events-none absolute text-center"
                            style={{
                              left: `${SIGNATURE_NAME_BOX.left}%`,
                              top: `${SIGNATURE_NAME_BOX.top + 2.6}%`,
                              width: `${SIGNATURE_NAME_BOX.width}%`,
                            }}
                          >
                            <p className="whitespace-nowrap font-mono-tech text-[8px] font-bold tracking-[0.28em] text-green-600 sm:text-[10px]">
                              SIGN HERE
                            </p>
                          </div>
                        )}

                        <div
                          className="absolute"
                          style={{
                            left: `${SIGNATURE_BOX.left}%`,
                            top: `${SIGNATURE_BOX.top}%`,
                            width: `${SIGNATURE_BOX.width}%`,
                            height: `${SIGNATURE_BOX.height}%`,
                          }}
                        >
                          <div className="relative h-full w-full overflow-hidden border border-dashed border-zinc-400/70 bg-white/16">
                            <canvas
                              ref={drawCanvasRef}
                              onPointerDown={handlePointerDown}
                              onPointerMove={handlePointerMove}
                              onPointerUp={finishStroke}
                              onPointerLeave={finishStroke}
                              onPointerCancel={finishStroke}
                              className={`absolute inset-0 h-full w-full touch-none ${
                                nameConfirmed
                                  ? "cursor-crosshair pointer-events-auto"
                                  : "pointer-events-none"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
