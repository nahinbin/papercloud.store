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
    <div className="space-y-4">
      {/* Color Variants */}
      {colorVariants && colorVariants.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Color {selectedColor && <span className="text-gray-500 font-normal">({selectedColor})</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {colorVariants.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onColorSelect?.(color)}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition ${
                  selectedColor === color
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Size {selectedSize && <span className="text-gray-500 font-normal">({selectedSize})</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {sizeVariants.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onSizeSelect?.(size)}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition min-w-[3rem] ${
                  selectedSize === size
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
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

