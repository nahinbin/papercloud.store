"use client";

interface ProductVariantsProps {
  colorVariants?: string[];
  sizeVariants?: string[];
  selectedColor?: string;
  selectedSize?: string;
  onColorSelect?: (color: string) => void;
  onSizeSelect?: (size: string) => void;
}

export default function ProductVariants({
  colorVariants,
  sizeVariants,
  selectedColor,
  selectedSize,
  onColorSelect,
  onSizeSelect,
}: ProductVariantsProps) {
  if ((!colorVariants || colorVariants.length === 0) && (!sizeVariants || sizeVariants.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Color Variants */}
      {colorVariants && colorVariants.length > 0 && (
        <div>
          <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">
            Color {selectedColor && <span className="ml-2 text-zinc-400 normal-case tracking-normal">({selectedColor})</span>}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {colorVariants.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onColorSelect?.(color)}
                aria-pressed={selectedColor === color}
                className={`rounded-full border px-4 py-2 text-sm font-medium tracking-tight transition ${
                  selectedColor === color
                    ? "border-black bg-black text-white shadow-[0_15px_30px_rgba(15,23,42,0.25)]"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Variants */}
      {sizeVariants && sizeVariants.length > 0 && (
        <div>
          <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">
            Size {selectedSize && <span className="ml-2 text-zinc-400 normal-case tracking-normal">({selectedSize})</span>}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {sizeVariants.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onSizeSelect?.(size)}
                aria-pressed={selectedSize === size}
                className={`min-w-[3rem] rounded-full border px-4 py-2 text-sm font-semibold tracking-tight transition ${
                  selectedSize === size
                    ? "border-black bg-black text-white shadow-[0_15px_30px_rgba(15,23,42,0.25)]"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

