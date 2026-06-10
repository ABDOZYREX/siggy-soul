import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { toast } from "sonner";
import { Smoke } from "@/components/Smoke";
import { Lightning } from "@/components/Lightning";
import { Rain } from "@/components/Rain";
import { NftCard } from "@/components/NftCard";
import { Download } from "lucide-react";
import { AudioToggle } from "@/components/AudioToggle";
import { SignatureDialog } from "@/components/SignatureDialog";
import { shouldReduceEffects } from "@/lib/performance";

const CONTRACT_ADDRESS = "0xcf7BCB8552437BadA08B89f86428ab08b4ece3A8" as const;
const MINT_PRICE = "0.0001";
const CONTRACT_ABI = [
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
] as const;

const ritualLogo = "https://pbs.twimg.com/profile_images/2047761933764268032/ltdZOulq_400x400.jpg";

type Nft = { id: string; name: string; image: string };

const NFTS: { top: Nft; left: Nft; right: Nft } = {
  top: {
    id: "nft-born-in-the-dark",
    name: "Born in the Dark",
    image:
      "https://gateway.pinata.cloud/ipfs/bafybeibiqfm36xgdeale43o32oblfv4vcm35ygpjkrn3un66cz3oxfsyvq",
  },
  left: {
    id: "nft-green-miasma",
    name: "The Green Miasma",
    image:
      "https://gateway.pinata.cloud/ipfs/bafybeifghypi476odpjfazdfikib57icrx5urtbakbeupbya4t4hsuxali",
  },
  right: {
    id: "nft-shadow-of-siggy",
    name: "Shadow of Siggy",
    image:
      "https://gateway.pinata.cloud/ipfs/bafybeid4ozffq7mfvpceh6jih56h3vbftnow5etc6by43l43dtavg6wkj4",
  },
};

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Siggy Soul" },
      { name: "description", content: "Mint the Siggy Soul collection on Ritual Testnet." },
      { property: "og:title", content: "Siggy Soul" },
      { property: "og:description", content: "Mint the Siggy Soul collection on Ritual Testnet." },
      { name: "twitter:title", content: "Siggy Soul" },
      { name: "twitter:description", content: "Mint the Siggy Soul collection on Ritual Testnet." },
    ],
  }),
});

function Index() {
  const { isConnected, address } = useAccount();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [pendingNft, setPendingNft] = useState<Nft | null>(null);
  const [successNft, setSuccessNft] = useState<Nft | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mintedMap, setMintedMap] = useState<Record<string, boolean>>({});
  const [reducedEffects, setReducedEffects] = useState(false);

  const storageKey = address ? `siggy-soul-minted:${address.toLowerCase()}` : null;

  useEffect(() => {
    setReducedEffects(shouldReduceEffects());
  }, []);

  useEffect(() => {
    if (!storageKey) {
      setMintedMap({});
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      setMintedMap(raw ? JSON.parse(raw) : {});
    } catch {
      setMintedMap({});
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isSuccess || !pendingNft) return;

    setSuccessNft(pendingNft);
    setShowSuccess(true);
    toast.success(`Minted ${pendingNft.name}!`);

    if (storageKey) {
      setMintedMap((prev) => {
        const next = { ...prev, [pendingNft.id]: true };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    }

    setPendingNft(null);
    reset();
  }, [isSuccess, pendingNft, reset, storageKey]);

  const hasMinted = (nft: Nft) => Boolean(mintedMap[nft.id]);

  const handleMint = (nft: Nft) => {
    if (!isConnected) {
      toast.error("Connect your wallet first");
      return;
    }

    if (hasMinted(nft)) {
      toast.error("Your wallet has already completed this ritual. Only one soul per wallet is permitted.");
      return;
    }

    setPendingNft(nft);
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "mint",
        value: parseEther(MINT_PRICE),
      },
      {
        onSuccess: () => toast.success(`${nft.name}: transaction submitted`),
        onError: (error) => {
          toast.error(error.message.split("\n")[0] ?? "Mint failed");
          setPendingNft(null);
        },
      },
    );
  };

  const labelFor = (nft: Nft) => {
    if (hasMinted(nft)) return "MINTED";
    if (pendingNft?.id === nft.id) {
      if (isPending) return "CONFIRM...";
      if (isConfirming) return "MINTING...";
    }
    return "MINT";
  };

  const busyFor = (nft: Nft) => pendingNft?.id === nft.id && (isPending || isConfirming);
  const disabledFor = (nft: Nft) => hasMinted(nft);

  const shareText = successNft
    ? `I just minted ${successNft.name} from the Siggy Soul collection on @RitualNet Testnet! #Ritual #NFT #SiggySoul`
    : "";
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 mist-bg" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 20% 30%, oklch(0.3 0.15 145 / 0.3), transparent 50%), radial-gradient(ellipse at 80% 70%, oklch(0.3 0.15 145 / 0.25), transparent 50%)",
        }}
      />
      {!reducedEffects && <Smoke />}
      {!reducedEffects && <Rain />}
      <Lightning lite />

      <header className="relative z-20 flex flex-col gap-3 px-3 py-4 sm:px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-12 md:py-6">
        <div className="flex w-full items-center justify-between gap-3 md:contents">
          <div className="flex min-w-0 items-center gap-2 md:justify-self-start md:justify-start">
            <img
              src={ritualLogo}
              alt="Ritual logo"
              width={24}
              height={24}
              className="w-6 h-6 rounded-full bg-transparent"
              style={{ filter: "drop-shadow(0 0 6px oklch(0.78 0.22 145 / 0.9))" }}
            />
            <span className="whitespace-nowrap font-mono-tech text-xs text-primary text-glow uppercase leading-none tracking-[0.28em] sm:text-lg md:hidden">
              Ritual
            </span>
            <span className="hidden whitespace-nowrap font-mono-tech text-xl text-primary text-glow tracking-[0.5em] uppercase leading-none md:inline">
              R I T U A L
            </span>
          </div>

          <div className="flex items-center gap-2 md:justify-self-end md:justify-end md:gap-3">
            <AudioToggle />
            <div className="md:hidden">
              <ConnectButton.Custom>
                {({ mounted, account, chain, authenticationStatus, openAccountModal, openChainModal, openConnectModal }) => {
                  const ready = mounted && authenticationStatus !== "loading";
                  const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus || authenticationStatus === "authenticated");

                  if (!connected) {
                    return (
                      <button
                        type="button"
                        onClick={openConnectModal}
                        className="rounded-md border border-primary/70 bg-primary px-3 py-2 font-sans text-sm font-semibold text-black shadow-[0_0_18px_oklch(0.78_0.22_145_/_0.35)] transition-colors hover:bg-primary/90"
                      >
                        Connect
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        type="button"
                        onClick={openChainModal}
                        className="rounded-md border border-destructive/60 bg-destructive/20 px-3 py-2 font-sans text-sm font-semibold text-destructive"
                      >
                        Network
                      </button>
                    );
                  }

                  return (
                    <button
                      type="button"
                      onClick={openAccountModal}
                      className="rounded-md border border-primary/70 bg-primary px-3 py-2 font-sans text-sm font-semibold text-black shadow-[0_0_18px_oklch(0.78_0.22_145_/_0.35)] transition-colors hover:bg-primary/90"
                    >
                      Wallet
                    </button>
                  );
                }}
              </ConnectButton.Custom>
            </div>
            <div className="hidden md:block">
              <ConnectButton
                chainStatus="icon"
                accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
                showBalance={false}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center md:col-start-2 md:row-start-1">
          <SignatureDialog />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-24 md:px-12">
        <div className="intro-fade-up text-center mt-8 md:mt-14">
          <p className="font-mono-tech mb-4 text-xs tracking-[0.5em] text-primary/70">
            -- RITUAL TESTNET COLLECTION --
          </p>
          <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl tracking-wider text-primary text-glow">
            SIGGY SOUL
          </h1>
        </div>

        <div className="mt-14 flex justify-center md:mt-20">
          <NftCard
            id={NFTS.top.id}
            name={NFTS.top.name}
            image={NFTS.top.image}
            priority
            reducedEffects={reducedEffects}
            revealDelayMs={100}
            busy={busyFor(NFTS.top)}
            disabled={disabledFor(NFTS.top)}
            buttonLabel={labelFor(NFTS.top)}
            onMint={() => handleMint(NFTS.top)}
          />
        </div>

        <div className="mt-20 grid grid-cols-1 justify-items-center gap-14 md:grid-cols-2 md:gap-20">
          <NftCard
            id={NFTS.left.id}
            name={NFTS.left.name}
            image={NFTS.left.image}
            reducedEffects={reducedEffects}
            revealDelayMs={180}
            busy={busyFor(NFTS.left)}
            disabled={disabledFor(NFTS.left)}
            buttonLabel={labelFor(NFTS.left)}
            onMint={() => handleMint(NFTS.left)}
          />
          <NftCard
            id={NFTS.right.id}
            name={NFTS.right.name}
            image={NFTS.right.image}
            reducedEffects={reducedEffects}
            revealDelayMs={260}
            busy={busyFor(NFTS.right)}
            disabled={disabledFor(NFTS.right)}
            buttonLabel={labelFor(NFTS.right)}
            onMint={() => handleMint(NFTS.right)}
          />
        </div>

        <p className="intro-fade mt-24 text-center font-display italic text-lg text-muted-foreground md:text-xl">
          "Every soul must join the ritual."
        </p>
      </main>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="border-glow-strong bg-background max-w-2xl p-8 md:p-12">
          <DialogHeader className="space-y-4">
            <DialogTitle className="font-display text-4xl md:text-5xl tracking-widest text-primary text-glow text-center">
              {successNft?.name ?? "Siggy Soul"}
            </DialogTitle>
            <DialogDescription className="text-center font-mono-tech text-sm md:text-lg tracking-[0.15em] text-muted-foreground">
              {successNft
                ? `You have successfully minted ${successNft.name} from Siggy Soul collection. Your soul is now with Siggy.`
                : "Your soul is now with Siggy."}
            </DialogDescription>
          </DialogHeader>
          {successNft && (
            <div className="flex justify-center py-4">
              <img
                src={successNft.image}
                alt={successNft.name}
                loading="lazy"
                decoding="async"
                className="w-80 h-80 object-cover md:w-96 md:h-96"
                style={{
                  boxShadow:
                    "0 0 40px oklch(0.78 0.22 145 / 0.7), 0 0 80px oklch(0.78 0.22 145 / 0.5)",
                }}
              />
            </div>
          )}
          <div className="mt-4 flex flex-col items-stretch justify-center gap-4 sm:flex-row">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 py-5 font-display font-black tracking-[0.3em] text-base text-background bg-primary border-glow-strong transition-opacity hover:opacity-90 md:text-xl"
            >
              SHARE ON X
            </a>
            <button
              type="button"
              onClick={async () => {
                if (!successNft) return;
                try {
                  const res = await fetch(successNft.image);
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement("a");
                  anchor.href = url;
                  anchor.download = `${successNft.name.replace(/\s+/g, "_")}_Siggy_Soul.jpg`;
                  document.body.appendChild(anchor);
                  anchor.click();
                  anchor.remove();
                  URL.revokeObjectURL(url);
                } catch {
                  toast.error("Download failed");
                }
              }}
              className="inline-flex items-center justify-center gap-3 px-8 py-5 font-display font-black tracking-[0.3em] text-base text-primary bg-transparent border-2 border-primary border-glow-strong transition-colors hover:bg-primary hover:text-background md:text-xl"
            >
              <Download className="w-5 h-5" />
              DOWNLOAD NFT
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="relative z-10 pb-8 text-center font-mono-tech text-sm text-muted-foreground/80 uppercase tracking-[0.4em] md:text-base">
        Made by <span className="normal-case">LiTEino</span>
      </footer>
    </div>
  );
}
