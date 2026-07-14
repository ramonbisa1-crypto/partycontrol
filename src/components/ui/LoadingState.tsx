type LoadingStateProps = {
  title?: string;
  description?: string;
  fullPage?: boolean;
};

export default function LoadingState({
  title = "Daten werden geladen",
  description = "Bitte einen Moment warten.",
  fullPage = false,
}: LoadingStateProps) {
  return (
    <div
      className={`
        flex
        items-center
        justify-center
        p-6
        ${
          fullPage
            ? "min-h-screen bg-[#050505]"
            : "min-h-[420px]"
        }
      `}
    >
      <div className="text-center">
        <div className="relative mx-auto h-14 w-14">
          <div
            className="
              absolute
              inset-0
              rounded-full
              border-4
              border-zinc-800
            "
          />

          <div
            className="
              absolute
              inset-0
              animate-spin
              rounded-full
              border-4
              border-transparent
              border-t-yellow-400
            "
          />

          <div
            className="
              absolute
              inset-[18px]
              rounded-full
              bg-yellow-400
              shadow-lg
              shadow-yellow-400/25
            "
          />
        </div>

        <p className="mt-5 text-lg font-black">
          {title}
        </p>

        <p className="mt-1 text-sm text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}