import { useState } from "react";
import { RefreshCw, Download, SlidersHorizontal, ChevronDown } from "lucide-react";
import { DATE_PRESETS } from "../utils/dateRanges";
import "./FilterBar.css";

const FilterBar = ({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  classrooms = [],
  classroomId,
  onClassroomChange,
  onRefresh,
  refreshing,
  onExportCsv,
  onExportPdf,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="filter-bar">
      <button
        type="button"
        className="filter-bar-mobile-toggle"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-controls="analytics-filter-controls"
        data-tooltip="Filters"
        title="Filters"
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        Filters
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`transition-transform ${mobileOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id="analytics-filter-controls"
        className={`filter-bar-controls ${mobileOpen ? "flex" : "hidden md:flex"}`}
      >
        <div className="filter-field">
          <label htmlFor="analytics-date-preset" className="filter-label">
            Date range
          </label>
          <select
            id="analytics-date-preset"
            className="filter-select"
            value={preset}
            onChange={(e) => onPresetChange(e.target.value)}
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {preset === "custom" && (
          <div className="flex items-end gap-2">
            <div className="filter-field">
              <label htmlFor="analytics-from" className="filter-label">
                From
              </label>
              <input
                id="analytics-from"
                type="date"
                className="filter-select"
                value={customFrom}
                onChange={(e) => onCustomFromChange(e.target.value)}
              />
            </div>
            <div className="filter-field">
              <label htmlFor="analytics-to" className="filter-label">
                To
              </label>
              <input
                id="analytics-to"
                type="date"
                className="filter-select"
                value={customTo}
                onChange={(e) => onCustomToChange(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="filter-field">
          <label htmlFor="analytics-class" className="filter-label">
            Class
          </label>
          <select
            id="analytics-class"
            className="filter-select"
            value={classroomId}
            onChange={(e) => onClassroomChange(e.target.value)}
          >
            <option value="all">All Classes</option>
            {classrooms.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-bar-actions">
          <button
            type="button"
            onClick={onRefresh}
            className="filter-icon-btn"
            data-tooltip="Refresh"
            title="Refresh"
            aria-label="Refresh analytics data"
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              className="filter-icon-btn"
              data-tooltip="Export"
              title="Export"
              aria-haspopup="true"
              aria-expanded={exportOpen}
            >
              <Download size={16} aria-hidden="true" />
              Export
            </button>
            {exportOpen && (
              <div className="filter-export-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  data-tooltip="Export CSV"
                  title="Export CSV"
                  onClick={() => {
                    setExportOpen(false);
                    onExportCsv();
                  }}
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  role="menuitem"
                  data-tooltip="Export PDF"
                  title="Export PDF"
                  onClick={() => {
                    setExportOpen(false);
                    onExportPdf();
                  }}
                >
                  Export PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
