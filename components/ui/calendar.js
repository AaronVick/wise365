//  /components/ui/calendar.js
import React from 'react';

const Calendar = ({ date, onDateChange }) => (
  <div className="calendar">
    <p>Selected Date: {date}</p>
    <button onClick={() => onDateChange(new Date())}>Today</button>
  </div>
);

export default Calendar;
