import React, { useState } from 'react';

interface Props {
  onClose: () => void;
  onRatingSubmit: (rating: number) => void;
}

const QualityRatingModal: React.FC<Props> = ({ onClose, onRatingSubmit }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
    onRatingSubmit(rating);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-[400px] space-y-6">
        <h2 className="text-xl font-bold text-center">답변 품질은 어땠나요?</h2>
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((star) => (
            <svg
              key={star}
              xmlns="http://www.w3.org/2000/svg"
              className={`h-12 w-12 cursor-pointer transition-colors duration-200 ${
                (hoverRating || selectedRating) >= star ? 'text-yellow-400' : 'text-gray-300'
              }`}
              fill="currentColor"
              viewBox="0 0 24 24"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => handleStarClick(star)}
            >
              <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.353-7.416-3.87-7.416 3.87 1.48-8.353-6.064-5.828 8.332-1.151z" />
            </svg>
          ))}
        </div>
        <div className="text-center mt-4">
          <button
            className="text-gray-500 underline text-sm hover:text-gray-700"
            onClick={onClose}
          >
            나중에 평가하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default QualityRatingModal;