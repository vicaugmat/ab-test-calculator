import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

const App = () => {
  const [formData, setFormData] = useState({
    visitorsA: 1000,
    conversionsA: 35,
    visitorsB: 1000,
    conversionsB: 58,
    confidenceLevel: 0.95
  });
  
  const [results, setResults] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [activeTab, setActiveTab] = useState('results');
  const [theme, setTheme] = useState('light');
  
  // Function to calculate standard normal CDF
  const normalCDF = (x) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (x > 0) {
      prob = 1 - prob;
    }
    return prob;
  };
  
  // Function for normal distribution
  const normalPDF = (x, mean, stdDev) => {
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
      Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2)));
  };

  // Calculate results
  const calculateResults = () => {
    // Conversion rates
    const convRateA = formData.conversionsA / formData.visitorsA;
    const convRateB = formData.conversionsB / formData.visitorsB;
    
    // Standard errors
    const seA = Math.sqrt((convRateA * (1 - convRateA)) / formData.visitorsA);
    const seB = Math.sqrt((convRateB * (1 - convRateB)) / formData.visitorsB);
    
    // Standard error of difference
    const seDiff = Math.sqrt(seA**2 + seB**2);
    
    // Relative uplift
    const relativeUplift = (convRateB - convRateA) / convRateA;
    
    // Z-score
    const zScore = (convRateB - convRateA) / seDiff;
    
    // p-value (two-tailed)
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
    
    // Get critical Z based on confidence level
    let criticalZ;
    if (formData.confidenceLevel === 0.9) criticalZ = 1.645;
    else if (formData.confidenceLevel === 0.95) criticalZ = 1.96;
    else if (formData.confidenceLevel === 0.99) criticalZ = 2.576;
    
    // Statistical power
    const power = 1 - normalCDF(criticalZ - Math.abs(zScore)) + normalCDF(-criticalZ - Math.abs(zScore));
    
    // Confidence intervals
    const ciWidth = criticalZ * seA;
    const ciA = {
      lower: (convRateA - ciWidth) * 100,
      upper: (convRateA + ciWidth) * 100
    };
    
    const ciWidthB = criticalZ * seB;
    const ciB = {
      lower: (convRateB - ciWidthB) * 100,
      upper: (convRateB + ciWidthB) * 100
    };

    setResults({
      convRateA: convRateA * 100,
      convRateB: convRateB * 100,
      relativeUplift: relativeUplift * 100,
      absoluteUplift: (convRateB - convRateA) * 100,
      seA,
      seB, 
      seDiff,
      zScore,
      pValue,
      power: power * 100,
      significant: pValue < (1 - formData.confidenceLevel),
      ciA,
      ciB
    });

    // Generate data for the distribution chart
    generateChartData(convRateA, convRateB, seA, seB);
  };

  // Generate chart data for both distributions
  const generateChartData = (meanA, meanB, stdDevA, stdDevB) => {
    const minX = Math.min(meanA - 4 * stdDevA, meanB - 4 * stdDevB);
    const maxX = Math.max(meanA + 4 * stdDevA, meanB + 4 * stdDevB);
    const step = (maxX - minX) / 100;
    
    const data = [];
    for (let x = minX; x <= maxX; x += step) {
      const pdfA = normalPDF(x, meanA, stdDevA);
      const pdfB = normalPDF(x, meanB, stdDevB);
      
      // Scale for better visualization
      const scale = 60 / Math.max(
        normalPDF(meanA, meanA, stdDevA),
        normalPDF(meanB, meanB, stdDevB)
      );
      
      data.push({
        x: x * 100, // Convert to percentage
        A: pdfA * scale,
        B: pdfB * scale
      });
    }
    
    setChartData(data);
  };

  // Format number as percentage
  const formatPercent = (num) => {
    return `${num.toFixed(2)}%`;
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };
  
  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Calculate results when inputs change
  useEffect(() => {
    if (
      formData.visitorsA > 0 &&
      formData.visitorsB > 0 &&
      formData.conversionsA >= 0 &&
      formData.conversionsB >= 0
    ) {
      calculateResults();
    }
  }, [formData]);

  return (
    <div className={`p-4 max-w-6xl mx-auto ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Calculadora de Test A/B</h1>
        <button 
          onClick={toggleTheme} 
          className={`px-3 py-1 rounded ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar with inputs */}
        <div className="md:col-span-1">
          <div className={`p-4 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h2 className="text-lg font-semibold mb-4">Configuración</h2>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Variante A (Control)</h3>
              <div className="mb-2">
                <label className="block text-sm mb-1">Visitantes:</label>
                <input 
                  type="number" 
                  name="visitorsA"
                  value={formData.visitorsA}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded text-gray-800"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Conversiones:</label>
                <input 
                  type="number" 
                  name="conversionsA"
                  value={formData.conversionsA}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded text-gray-800"
                  min="0"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Variante B</h3>
              <div className="mb-2">
                <label className="block text-sm mb-1">Visitantes:</label>
                <input 
                  type="number" 
                  name="visitorsB"
                  value={formData.visitorsB}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded text-gray-800"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Conversiones:</label>
                <input 
                  type="number" 
                  name="conversionsB"
                  value={formData.conversionsB}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded text-gray-800"
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Configuración Avanzada</h3>
              <div>
                <label className="block text-sm mb-1">Nivel de confianza:</label>
                <select 
                  name="confidenceLevel"
                  value={formData.confidenceLevel}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded text-gray-800"
                >
                  <option value={0.9}>90%</option>
                  <option value={0.95}>95%</option>
                  <option value={0.99}>99%</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="md:col-span-3">
          {results && (
            <>
              <div className="mb-4">
                {/* Tabs */}
                <div className="flex border-b mb-4">
                  <button 
                    className={`px-4 py-2 ${activeTab === 'results' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
                    onClick={() => setActiveTab('results')}
                  >
                    Resultados
                  </button>
                  <button 
                    className={`px-4 py-2 ${activeTab === 'visualization' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
                    onClick={() => setActiveTab('visualization')}
                  >
                    Visualización
                  </button>
                  <button 
                    className={`px-4 py-2 ${activeTab === 'details' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
                    onClick={() => setActiveTab('details')}
                  >
                    Detalles
                  </button>
                </div>
                
                {/* Results summary */}
                <div className={`p-4 rounded mb-4 ${results.significant ? 'bg-green-100 border border-green-200' : 'bg-yellow-100 border border-yellow-200'} ${theme === 'dark' ? 'text-gray-800' : ''}`}>
                  <h2 className="text-lg font-semibold mb-2">
                    {results.significant ? '¡Resultado significativo!' : 'Resultado no significativo'}
                  </h2>
                  <p>
                    La tasa de conversión de la variante B ({formatPercent(results.convRateB)}) 
                    {results.convRateB > results.convRateA ? ' fue ' : ' fue '}
                    <strong>{Math.abs(results.relativeUplift).toFixed(2)}%</strong> 
                    {results.convRateB > results.convRateA ? ' mayor ' : ' menor '} 
                    que la tasa de conversión de la variante A ({formatPercent(results.convRateA)}).
                    {results.significant ? 
                      ` Puedes estar ${(formData.confidenceLevel * 100).toFixed(0)}% seguro que este resultado es consecuencia de los cambios realizados y no del azar.` : 
                      ' Este resultado no es estadísticamente significativo y podría deberse al azar.'}
                  </p>
                </div>
              </div>
              
              {activeTab === 'results' && (
                <div className={`p-4 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-white border'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">Tasas de Conversión</h3>
                      <div className="flex items-center mb-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                        <div>
                          <div className="text-sm">Variante A</div>
                          <div className="font-semibold">{formatPercent(results.convRateA)}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                        <div>
                          <div className="text-sm">Variante B</div>
                          <div className="font-semibold">{formatPercent(results.convRateB)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-3">Mejora</h3>
                      <div className="flex items-center mb-2">
                        <div>
                          <div className="text-sm">Mejora relativa</div>
                          <div className="font-semibold">{results.relativeUplift.toFixed(2)}%</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm">Mejora absoluta</div>
                          <div className="font-semibold">{results.absoluteUplift.toFixed(2)}%</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-3">Significancia</h3>
                      <div className="flex items-center mb-2">
                        <div>
                          <div className="text-sm">P-valor</div>
                          <div className="font-semibold">{results.pValue.toFixed(4)}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm">Z-score</div>
                          <div className="font-semibold">{results.zScore.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-3">Confianza</h3>
                      <div className="flex items-center mb-2">
                        <div>
                          <div className="text-sm">Potencia estadística</div>
                          <div className="font-semibold">{results.power.toFixed(2)}%</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm">Resultado</div>
                          <div className={`font-semibold ${results.significant ? 'text-green-500' : 'text-yellow-500'}`}>
                            {results.significant ? 'Significativo' : 'No significativo'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'visualization' && (
                <div className={`p-4 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-white border'}`}>
                  <h3 className="font-medium mb-3">Distribuciones de Tasas de Conversión</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="x" 
                          label={{ value: 'Tasa de Conversión (%)', position: 'insideBottom', offset: -5 }}
                          tickFormatter={(value) => value.toFixed(1)}
                        />
                        <YAxis label={{ value: 'Densidad', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value, name) => [value.toFixed(2), name === 'A' ? 'Variante A' : 'Variante B']}
                          labelFormatter={(value) => `CR: ${parseFloat(value).toFixed(2)}%`}
                        />
                        <ReferenceLine 
                          x={results.convRateA} 
                          stroke="#2563eb" 
                          strokeDasharray="3 3" 
                          label={{ value: 'A', position: 'top', fill: '#2563eb' }} 
                        />
                        <ReferenceLine 
                          x={results.convRateB} 
                          stroke="#10b981" 
                          strokeDasharray="3 3" 
                          label={{ value: 'B', position: 'top', fill: '#10b981' }} 
                        />
                        <Area type="monotone" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                        <Legend />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">Intervalos de Confianza ({(formData.confidenceLevel * 100).toFixed(0)}%)</h3>
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            type="number"
                            domain={[
                              Math.min(results.ciA.lower, results.ciB.lower) - 0.5,
                              Math.max(results.ciA.upper, results.ciB.upper) + 0.5
                            ]}
                            label={{ value: 'Tasa de Conversión (%)', position: 'insideBottom', offset: -5 }}
                          />
                          <YAxis hide />
                          <Tooltip />
                          <ReferenceLine x={results.convRateA} stroke="#2563eb" label={{ value: 'A', position: 'top' }} />
                          <ReferenceLine x={results.convRateB} stroke="#10b981" label={{ value: 'B', position: 'top' }} />
                          <Legend />
                          <Line 
                            dataKey="a" 
                            data={[
                              { a: results.convRateA, x: results.ciA.lower },
                              { a: results.convRateA, x: results.ciA.upper }
                            ]}
                            stroke="#2563eb"
                            strokeWidth={4}
                            dot={{ stroke: '#2563eb', strokeWidth: 2, r: 4 }}
                            name="Intervalo A"
                          />
                          <Line 
                            dataKey="b" 
                            data={[
                              { b: results.convRateB, x: results.ciB.lower },
                              { b: results.convRateB, x: results.ciB.upper }
                            ]}
                            stroke="#10b981"
                            strokeWidth={4}
                            dot={{ stroke: '#10b981', strokeWidth: 2, r: 4 }}
                            name="Intervalo B"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'details' && (
                <div className={`p-4 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-white border'}`}>
                  <h3 className="font-medium mb-3">Detalles Estadísticos</h3>
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Métrica</td>
                        <td className="py-2 font-medium">Variante A</td>
                        <td className="py-2 font-medium">Variante B</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Visitantes</td>
                        <td className="py-2">{formData.visitorsA}</td>
                        <td className="py-2">{formData.visitorsB}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Conversiones</td>
                        <td className="py-2">{formData.conversionsA}</td>
                        <td className="py-2">{formData.conversionsB}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Tasa de Conversión</td>
                        <td className="py-2">{formatPercent(results.convRateA)}</td>
                        <td className="py-2">{formatPercent(results.convRateB)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Error Estándar</td>
                        <td className="py-2">{results.seA.toFixed(6)}</td>
                        <td className="py-2">{results.seB.toFixed(6)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Intervalo de Confianza ({(formData.confidenceLevel * 100).toFixed(0)}%)</td>
                        <td className="py-2">{formatPercent(results.ciA.lower)} - {formatPercent(results.ciA.upper)}</td>
                        <td className="py-2">{formatPercent(results.ciB.lower)} - {formatPercent(results.ciB.upper)}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <h3 className="font-medium mt-6 mb-3">Cálculos Adicionales</h3>
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Error Estándar de la Diferencia</td>
                        <td className="py-2">{results.seDiff.toFixed(6)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Z-Score</td>
                        <td className="py-2">{results.zScore.toFixed(4)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">P-Valor (dos colas)</td>
                        <td className="py-2">{results.pValue.toFixed(6)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Potencia Estadística</td>
                        <td className="py-2">{results.power.toFixed(2)}%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Mejora Relativa</td>
                        <td className="py-2">{results.relativeUplift.toFixed(2)}%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Mejora Absoluta</td>
                        <td className="py-2">{results.absoluteUplift.toFixed(2)}%</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-100">
                    <h3 className="font-medium mb-2">¿Cómo interpretar estos resultados?</h3>
                    <p className="text-sm">
                      Un <strong>p-valor</strong> menor que {(1 - formData.confidenceLevel).toFixed(2)} indica que existe una diferencia estadísticamente significativa entre las variantes con un nivel de confianza del {(formData.confidenceLevel * 100).toFixed(0)}%.
                      La <strong>potencia estadística</strong> superior al 80% indica que el test tiene suficiente capacidad para detectar diferencias reales.
                      Si los <strong>intervalos de confianza</strong> de ambas variantes no se solapan, hay una fuerte evidencia de diferencia real.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;