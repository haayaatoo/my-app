import React, { useState } from 'react';

const DeleteDropZone = ({ onDrop }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const engineerId = e.dataTransfer.getData('engineer-id');
    if (engineerId) {
      onDrop(parseInt(engineerId));
    }
  };

  return (
    <div 
      className={`drop-zone fixed bottom-8 right-8 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
        isDragOver 
          ? 'bg-red-500 shadow-2xl scale-110 drag-over' 
          : 'bg-red-400 shadow-lg hover:bg-red-500'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-center">
        <div className={`text-3xl text-white ${isDragOver ? 'animate-bounce' : ''}`}>
          <i className="fas fa-trash-alt"></i>
        </div>
        <div className="text-xs text-white font-semibold mt-1">
          ドロップして削除
        </div>
      </div>
    </div>
  );
};

export default DeleteDropZone;
