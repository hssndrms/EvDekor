
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string; // Added placeholder to props
}

export const Select: React.FC<SelectProps> = ({ 
  label, 
  id, 
  error, 
  containerClassName, 
  className, 
  options, 
  placeholder, // Destructured placeholder
  ...restProps // Renamed to restProps to avoid confusion and ensure only valid HTMLSelectAttributes are spread
}) => {
  const defaultId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className={`mb-4 ${containerClassName || ''}`}>
      {label && <label htmlFor={defaultId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <select
        id={defaultId}
        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 sm:text-sm rounded-md ${restProps.disabled ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400' : ''} ${error ? 'border-red-500 dark:border-red-400' : ''} ${className || ''}`}
        {...restProps}
      >
        {placeholder && <option value="" disabled selected>{placeholder}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value} className="dark:bg-gray-700 dark:text-gray-100">{option.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};