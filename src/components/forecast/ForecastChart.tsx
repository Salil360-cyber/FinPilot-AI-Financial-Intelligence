import React, { useState } from 'react';
import {
  ForecastRunResult,
  ScenarioProjectionSummary,
} from '../../types/forecast';
import { roundCurrency } from '../../services/salesInvoiceCalculator';

interface ForecastChartProps {
  runResult: ForecastRunResult;
  scenarios: ScenarioProjectionSummary[];
  currencySymbol?: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  runResult,
  scenarios,
  currencySymbol = '$',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeScenariosVisible, setActiveScenariosVisible] = useState<Record<string, boolean>>({
    base: true,
    optimistic: true,
    conservative: true,
  });

  const toggleScenario = (id: string) => {
    setActiveScenariosVisible((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const histPoints = runResult.historicalSummary.points.filter((p) => !p.isMissing);
  const fcstPoints = runResult.periods;

  // Combine historical and forecast points into one contiguous sequence
  interface UnifiedChartPoint {
    period: string;
    label: string;
    isForecast: boolean;
    actualValue?: number;
    forecastValue?: number;
    rangeLower?: number;
    rangeUpper?: number;
    scenarioValues: Record<string, number>;
  }

  const chartSeries: UnifiedChartPoint[] = [];

  histPoints.forEach((hp) => {
    chartSeries.push({
      period: hp.period,
      label: hp.periodLabel,
      isForecast: false,
      actualValue: hp.value,
      scenarioValues: {},
    });
  });

  fcstPoints.forEach((fp) => {
    const scVals: Record<string, number> = {};
    scenarios.forEach((sc) => {
      const match = sc.monthlyProjections.find((m) => m.period === fp.period);
      if (match) scVals[sc.scenarioId] = match.value;
    });

    chartSeries.push({
      period: fp.period,
      label: fp.periodLabel,
      isForecast: true,
      forecastValue: fp.pointEstimate,
      rangeLower: fp.rangeLower,
      rangeUpper: fp.rangeUpper,
      scenarioValues: scVals,
    });
  });

  if (chartSeries.length === 0) {
    return (
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        No historical or forecast data points available for charting.
      </div>
    );
  }

  // Calculate Chart Extents
  let allValues: number[] = [];
  chartSeries.forEach((p) => {
    if (p.actualValue !== undefined) allValues.push(p.actualValue);
    if (p.forecastValue !== undefined) allValues.push(p.forecastValue);
    if (p.rangeUpper !== undefined) allValues.push(p.rangeUpper);
    if (p.rangeLower !== undefined) allValues.push(p.rangeLower);
    Object.values(p.scenarioValues).forEach((v) => allValues.push(v));
  });

  const maxValue = Math.max(...allValues, 1000);
  const minValue = Math.min(0, ...allValues);

  // SVG Dimensions & Margins
  const width = 800;
  const height = 320;
  const paddingLeft = 65;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const totalPoints = chartSeries.length;
  const getX = (index: number) => {
    if (totalPoints <= 1) return paddingLeft + chartW / 2;
    return paddingLeft + (index / (totalPoints - 1)) * chartW;
  };

  const getY = (val: number) => {
    const range = maxValue - minValue;
    if (range === 0) return paddingTop + chartH / 2;
    const norm = (val - minValue) / range;
    return paddingTop + chartH - norm * chartH;
  };

  // Boundary between historical and forecast
  const boundaryIndex = histPoints.length - 1;
  const boundaryX = boundaryIndex >= 0 ? getX(boundaryIndex) : paddingLeft;

  // Generate Path for Historical Actuals
  let histPathD = '';
  histPoints.forEach((hp, idx) => {
    const x = getX(idx);
    const y = getY(hp.value);
    if (idx === 0) histPathD += `M ${x} ${y}`;
    else histPathD += ` L ${x} ${y}`;
  });

  // Generate Path for Forecast Baseline (connecting from last historical point to forecast points)
  let fcstPathD = '';
  if (histPoints.length > 0 && fcstPoints.length > 0) {
    const lastHistX = getX(histPoints.length - 1);
    const lastHistY = getY(histPoints[histPoints.length - 1].value);
    fcstPathD = `M ${lastHistX} ${lastHistY}`;
    fcstPoints.forEach((fp, idx) => {
      const x = getX(histPoints.length + idx);
      const y = getY(fp.pointEstimate);
      fcstPathD += ` L ${x} ${y}`;
    });
  }

  // Generate Uncertainty Area Polygon (connecting from last historical point through upper then lower)
  let uncertaintyPolygonD = '';
  if (histPoints.length > 0 && fcstPoints.length > 0) {
    const lastHistX = getX(histPoints.length - 1);
    const lastHistY = getY(histPoints[histPoints.length - 1].value);

    // Upper boundary
    let upperStr = `M ${lastHistX} ${lastHistY}`;
    fcstPoints.forEach((fp, idx) => {
      const x = getX(histPoints.length + idx);
      const y = getY(fp.rangeUpper);
      upperStr += ` L ${x} ${y}`;
    });

    // Lower boundary reversed
    let lowerStr = '';
    for (let i = fcstPoints.length - 1; i >= 0; i--) {
      const x = getX(histPoints.length + i);
      const y = getY(fcstPoints[i].rangeLower);
      lowerStr += ` L ${x} ${y}`;
    }
    lowerStr += ` L ${lastHistX} ${lastHistY} Z`;

    uncertaintyPolygonD = upperStr + lowerStr;
  }

  // Scenarios paths
  const scenarioPaths: { id: string; name: string; color: string; pathD: string }[] = [];
  scenarios.forEach((sc) => {
    if (!activeScenariosVisible[sc.scenarioId]) return;
    if (histPoints.length === 0) return;

    const lastHistX = getX(histPoints.length - 1);
    const lastHistY = getY(histPoints[histPoints.length - 1].value);
    let pD = `M ${lastHistX} ${lastHistY}`;

    fcstPoints.forEach((fp, idx) => {
      const val = sc.monthlyProjections.find((m) => m.period === fp.period)?.value ?? fp.pointEstimate;
      const x = getX(histPoints.length + idx);
      const y = getY(val);
      pD += ` L ${x} ${y}`;
    });

    scenarioPaths.push({
      id: sc.scenarioId,
      name: sc.name,
      color: sc.color,
      pathD: pD,
    });
  });

  const activePoint = hoveredIndex !== null ? chartSeries[hoveredIndex] : null;

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
      {/* Chart Header & Scenario Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Historical Actuals vs. Forecast Trajectory
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dashed lines project future periods. Shaded band represents standard-deviation uncertainty.
          </p>
        </div>

        {/* Legend / Interactive Toggles */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-blue-400">
            <span className="w-3 h-0.5 bg-blue-500 rounded"></span>
            <span>Historical Actuals</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-3 h-0.5 bg-emerald-500 border-dashed rounded"></span>
            <span>Forecast Point Est.</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-2 bg-emerald-500/10 border border-emerald-500/30 rounded"></span>
            <span>Uncertainty Range</span>
          </div>

          {/* Scenario Filter Pills */}
          {scenarios.map((sc) => (
            <button
              key={sc.scenarioId}
              type="button"
              onClick={() => toggleScenario(sc.scenarioId)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                activeScenariosVisible[sc.scenarioId]
                  ? 'border-opacity-60 bg-opacity-10 text-white'
                  : 'opacity-40 border-slate-800 bg-slate-900 text-slate-400 line-through'
              }`}
              style={{
                borderColor: sc.color,
                backgroundColor: activeScenariosVisible[sc.scenarioId] ? `${sc.color}15` : undefined,
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.color }}></span>
              <span>{sc.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[650px] overflow-visible select-none"
        >
          {/* Background Grid Lines & Y-Axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const val = minValue + (maxValue - minValue) * (1 - pct);
            const y = paddingTop + pct * chartH;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {currencySymbol}
                  {Math.round(val).toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Boundary Line (Historical vs Forecast) */}
          {histPoints.length > 0 && fcstPoints.length > 0 && (
            <g>
              <line
                x1={boundaryX}
                y1={paddingTop - 5}
                x2={boundaryX}
                y2={paddingTop + chartH + 5}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <rect
                x={boundaryX - 55}
                y={paddingTop - 18}
                width={110}
                height={16}
                fill="#0f172a"
                stroke="#f59e0b"
                strokeWidth="1"
                rx="3"
              />
              <text
                x={boundaryX}
                y={paddingTop - 6}
                textAnchor="middle"
                fill="#fbbf24"
                fontSize="8.5"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
              >
                PROJECTION BOUNDARY
              </text>
            </g>
          )}

          {/* Shaded Uncertainty Area */}
          {uncertaintyPolygonD && (
            <path
              d={uncertaintyPolygonD}
              fill="#10b981"
              fillOpacity="0.08"
              stroke="#10b981"
              strokeWidth="0.75"
              strokeDasharray="2 2"
              strokeOpacity="0.25"
            />
          )}

          {/* Scenarios Curves */}
          {scenarioPaths.map((sc) => (
            <path
              key={sc.id}
              d={sc.pathD}
              fill="none"
              stroke={sc.color}
              strokeWidth="1.75"
              strokeDasharray="4 3"
              strokeOpacity="0.85"
            />
          ))}

          {/* Historical Path */}
          {histPathD && (
            <path
              d={histPathD}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Forecast Baseline Path */}
          {fcstPathD && (
            <path
              d={fcstPathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
          )}

          {/* Interactive Data Points & Vertical Hover Guide */}
          {chartSeries.map((point, idx) => {
            const x = getX(idx);
            const val = point.isForecast ? point.forecastValue! : point.actualValue!;
            const y = getY(val);
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Vertical guide on hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + chartH}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Point dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5.5 : 4}
                  fill={point.isForecast ? '#10b981' : '#3b82f6'}
                  stroke="#0b101b"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {/* X-Axis Labels */}
                <text
                  x={x}
                  y={height - 15}
                  textAnchor="middle"
                  fill={isHovered ? '#f8fafc' : '#64748b'}
                  fontSize="9.5"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {point.label.split(' ')[0]}
                </text>
                <text
                  x={x}
                  y={height - 4}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="8.5"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {point.label.split(' ')[1] || ''}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Inspection Overlay Tooltip */}
        {activePoint && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900 border border-slate-700/80 shadow-2xl rounded-lg p-3 text-xs w-64 backdrop-blur-md animate-in fade-in duration-100"
            style={{
              left: `${Math.min(75, Math.max(5, (getX(hoveredIndex!) / width) * 100))}%`,
              top: '15px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-white font-mono">{activePoint.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  activePoint.isForecast
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {activePoint.isForecast ? 'PROJECTION' : 'ACTUAL HISTORICAL'}
              </span>
            </div>

            <div className="py-2 space-y-1">
              {!activePoint.isForecast ? (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Observed Actual:</span>
                  <span className="font-mono font-bold text-blue-400">
                    {currencySymbol}
                    {roundCurrency(activePoint.actualValue || 0).toLocaleString()}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Baseline Forecast:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {currencySymbol}
                      {roundCurrency(activePoint.forecastValue || 0).toLocaleString()}
                    </span>
                  </div>

                  {activePoint.rangeLower !== undefined && activePoint.rangeUpper !== undefined && (
                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>Uncertainty Range:</span>
                      <span className="font-mono text-slate-300">
                        {currencySymbol}
                        {Math.round(activePoint.rangeLower).toLocaleString()} - {currencySymbol}
                        {Math.round(activePoint.rangeUpper).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Scenarios Values */}
                  {Object.entries(activePoint.scenarioValues).map(([scId, val]) => {
                    const sc = scenarios.find((s) => s.scenarioId === scId);
                    if (!sc || !activeScenariosVisible[scId]) return null;
                    return (
                      <div key={scId} className="flex justify-between items-center text-[11px] pt-0.5">
                        <span className="text-slate-400">{sc.name.split(' ')[0]}:</span>
                        <span className="font-mono font-medium" style={{ color: sc.color }}>
                          {currencySymbol}
                          {Math.round(val).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
