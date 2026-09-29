import React, { useState } from "react";
import {
  IoEyeOutline,
  IoEyeOffOutline,
  IoSettingsOutline,
  IoCloseSharp,
} from "react-icons/io5";
import { FiMoreHorizontal } from "react-icons/fi";
import { FaCode } from "react-icons/fa";

export default function IndicatorBar({
  indicator,
  timeframeValue,
  value,
  renderValue,
  indicatorVisibility,
  toggleIndicatorVisibility,
  removeIndicator,
  setActiveBarIndicator,
  setIndicatorProperty,
  setActiveSourceIndicator,
  setShowSourcePanel,
  type,
  indicatorConfigDefault,
  indicatorConfigs,
}) {
  const [isLabelHovered, setIsLabelHovered] = useState(false);

  // INDICATOR CONFIG

  const cfg = {
    ...(indicatorConfigDefault?.[type] || {}),
    ...(indicatorConfigs?.[indicator] || {}),
  };

  const len = cfg?.length ?? cfg?.baseLen ?? "";
  const src = cfg?.source ?? "";
  const maType = cfg?.maType ?? cfg?.matype ?? cfg?.ma_type ?? "";
  const configParts = [];
  if (maType) {
    configParts.push(maType);
  }
  if (len !== "" && len !== null && len !== undefined) {
    configParts.push(len);
  }

  if (src) {
    configParts.push(src);
  }

  const configString = configParts.join(" ");

  // COMMON ICON BUTTON CLASS

  const iconButtonClass = `
  inline-flex
  h-[18px]
  min-h-[18px]
  w-[18px]
  min-w-[18px]
  items-center
  justify-center
  m-0 p-0 border-0
  outline-none
  bg-transparent
  text-[var(--text-secondary)]
  rounded-[2px]
  cursor-pointer
  leading-none
  transition-colors
  duration-75
  hover:bg-[var(--bg-tertiary)]
  hover:text-[var(--text-primary)]
  active:bg-[var(--border-color)]
  active:text-[var(--text-primary)]
  focus:outline-none
`;

  // RENDER

  return (
    <div
      className="
        inline-flex
        h-[18px]
        min-h-[18px]
        w-fit
        max-w-full
        items-center
        m-0 p-0
        whitespace-nowrap
        select-none
        cursor-default
        text-[11px]
        leading-[18px]
        text-[var(--text-primary)]
      "
    >
      <div
        onMouseEnter={() => setIsLabelHovered(true)}
        onMouseLeave={() => setIsLabelHovered(false)}
        className={`inline-flex h-[18px] items-center gap-[3px] rounded-[4px] cursor-default
          transition-colors
          duration-100
    ${
      isLabelHovered
        ? `
          border
          border-[var(--border-color)]
          bg-[var(--bg-secondary)]
        `
        : `
          border-1 border-transparent 
          bg-transparent
        `
    }
  `}
      >
        {/* INDICATOR NAME */}

        <span className="inline-flex h-[18px] pl-[2px] items-center font-medium leading-[18px] text-[var(--text-primary)]">
          {type}
        </span>

        {/* INDICATOR CONFIGURATION */}

        {configString && (
          <span
            className="inline-flex h-[18px] items-center font-normal leading-[18px] text-[var(--text-secondary)]"
          >
            {configString}
          </span>
        )}
        {isLabelHovered && (
          <div className="ml-[2px] inline-flex h-[18px] items-center gap-[1px]">
            {/* VISIBILITY */}

            <button
              type="button"
              title={indicatorVisibility[indicator] ? "Hide" : "Show"}
              aria-label={
                indicatorVisibility[indicator]
                  ? "Hide indicator"
                  : "Show indicator"
              }
              className={iconButtonClass}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleIndicatorVisibility(indicator);
              }}
            >
              {indicatorVisibility[indicator] ? (
                <IoEyeOffOutline size={13} />
              ) : (
                <IoEyeOutline size={13} />
              )}
            </button>

            {/* SETTINGS */}

            <button
              type="button"
              title="Settings"
              aria-label="Indicator settings"
              className={iconButtonClass}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveBarIndicator({
                  id: indicator,
                  type,
                });
                setIndicatorProperty(true);
              }}
            >
              <IoSettingsOutline size={13} />
            </button>

            {/* SOURCE CODE */}

            <button
              type="button"
              title="Source code"
              aria-label="Indicator source code"
              className={iconButtonClass}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveSourceIndicator(indicator);
                setShowSourcePanel(true);
              }}
            >
              <FaCode size={11} />
            </button>

            {/* REMOVE */}

            <button
              type="button"
              title="Remove"
              aria-label="Remove indicator"
              className={iconButtonClass}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeIndicator(indicator);
              }}
            >
              <IoCloseSharp size={14} />
            </button>

            {/* MORE */}

            {/* <button
              type="button"
              title="More"
              aria-label="More indicator options"
              className={iconButtonClass}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <FiMoreHorizontal size={13} />
            </button> */}
          </div>
        )}
      </div>
      {!isLabelHovered && (
        <span
          className="
            ml-[5px]
            inline-flex
            h-[18px]
            items-center
            gap-[3px]
            leading-[18px]
            cursor-default
          "
        >
          {renderValue(indicator, value)}
        </span>
      )}
    </div>
  );
}
