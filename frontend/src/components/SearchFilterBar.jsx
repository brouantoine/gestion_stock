// src/components/SearchFilterBar.jsx
import React, { useState } from 'react';
const SearchFilterBar = ({ onSearch, filters, onFilterChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
  
    const handleSearch = (e) => {
      e.preventDefault();
      onSearch(searchTerm);
    };
  
    return (
      <div className="search-filter-bar">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Rechercher produits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">🔍</button>
        </form>
        
        <div className="filters">
          {filters.map(filter => (
            <div key={filter.name} className="filter-group">
              <label>{filter.label}</label>
              {filter.type === 'select' ? (
                <select
                  onChange={(e) => onFilterChange({ [filter.name]: e.target.value })}
                >
                  {filter.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={filter.type}
                  placeholder={filter.placeholder}
                  onChange={(e) => onFilterChange({ [filter.name]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  export default SearchFilterBar;