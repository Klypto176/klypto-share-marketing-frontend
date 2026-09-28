import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiCalendar, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const GoToDateDialog = ({ onClose, onGoTo }) => {
  const [selectedDate, setSelectedDate] = useState(() => localStorage.getItem('goToDateDialog_date') || new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(() => localStorage.getItem('goToDateDialog_time') || '09:15');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(localStorage.getItem('goToDateDialog_date') || new Date().toISOString().split('T')[0]);
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  // 0 is Sunday, we want Monday to be 0 for the UI
  const startDayOffset = (firstDayOfMonth + 6) % 7; 

  const today = new Date();
  const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  
  const handleDateClick = (day) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 12);
    // adjust for local timezone offset when getting ISO string
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    setSelectedDate(localDate);
    localStorage.setItem('goToDateDialog_date', localDate);
  };

  const handleGoTo = () => {
    const dateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    if (!isNaN(dateTime.getTime())) {
      onGoTo(dateTime);
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleGoTo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate, selectedTime, onGoTo, onClose]);

  const handleGoToLatest = () => {
    onGoTo("latest");
    onClose();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose}></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]">
        <div className="bg-[var(--bg-secondary)] w-[350px] rounded-lg shadow-2xl overflow-hidden flex flex-col text-[var(--text-primary)] font-sans border border-[var(--border-color)]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 pb-2">
          <h2 className="text-xl font-bold">Go to</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
            <FiX size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 border-b border-[var(--border-color)] flex gap-4 text-sm font-semibold">
          <div className="border-b-2 border-[var(--accent-color)] text-[var(--text-primary)] pb-2 cursor-pointer">Date</div>
        </div>

        {/* Inputs */}
        <div 
          className="p-4 flex gap-2" 
          onKeyDown={(e) => { if (e.key === 'Enter') handleGoTo(); }}
        >
          <div className="flex-1 flex items-center bg-[var(--bg-tertiary)] border border-[var(--accent-color)] rounded p-2 focus-within:ring-1 ring-[var(--accent-color)]">
            <input 
              type="text" 
              className="bg-transparent border-none outline-none text-[var(--text-primary)] w-full text-sm font-semibold"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                localStorage.setItem('goToDateDialog_date', e.target.value);
                const d = new Date(e.target.value);
                if (!isNaN(d.getTime())) {
                  setCurrentMonth(d);
                }
              }}
            />
            <FiCalendar className="text-[var(--text-secondary)] ml-2 shrink-0" size={16}/>
          </div>
          <div className="flex-1 flex items-center bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded p-2 focus-within:ring-1 ring-[var(--accent-color)]">
            <input 
              type="text" 
              className="bg-transparent border-none outline-none text-[var(--text-primary)] w-full text-sm font-semibold"
              value={selectedTime}
              onChange={(e) => {
                setSelectedTime(e.target.value);
                localStorage.setItem('goToDateDialog_time', e.target.value);
              }}
            />
            <FiClock className="text-[var(--text-secondary)] ml-2 shrink-0" size={16}/>
          </div>
        </div>

        {/* Calendar Widget */}
        <div className="px-4 pb-4 select-none">
          <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrevMonth} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"><FiChevronLeft size={20}/></button>
            <div className="font-semibold text-[15px]">{months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</div>
            <button onClick={handleNextMonth} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"><FiChevronRight size={20}/></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] mb-2 text-[var(--text-secondary)] uppercase font-bold">
            <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[13px] font-semibold">
            {Array.from({ length: startDayOffset }).map((_, i) => <div key={`empty-${i}`}></div>)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 12);
              const dateStr = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().split('T')[0];
              const isSelected = selectedDate === dateStr;
              const isDisabled = dateStr > todayStr;
              return (
                <div 
                  key={day} 
                  onClick={() => { if (!isDisabled) handleDateClick(day); }}
                  className={`py-[6px] rounded transition-colors ${
                    isDisabled 
                      ? 'text-[var(--text-secondary)] cursor-not-allowed opacity-40' 
                      : `cursor-pointer hover:bg-[var(--bg-tertiary)] ${isSelected ? 'bg-[var(--accent-color)] text-white font-bold' : 'text-[var(--text-primary)]'}`
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-color)] p-4 flex justify-end gap-2 bg-[var(--bg-secondary)]">
          <button onClick={handleGoToLatest} className="px-6 py-2 rounded border border-[var(--border-color)] text-[var(--text-primary)] bg-[var(--bg-tertiary)] hover:opacity-85 transition-colors text-sm font-semibold cursor-pointer">
            Today's Date
          </button>
          <button onClick={handleGoTo} className="px-6 py-2 rounded bg-[var(--accent-color)] text-white hover:opacity-90 transition-colors text-sm font-semibold cursor-pointer">
            Go to
          </button>
        </div>
      </div>
    </div>
    </>,
    document.body
  );
};

export default GoToDateDialog;
