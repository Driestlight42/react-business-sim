import React, { useEffect, useState } from "react";
import Papa from "papaparse";

const App = () => {
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState({});
  const [selected, setSelected] = useState({
    Business: [],
    Skill: [],
    Resource: [],
    Market: [],
  });
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    fetch("/Game.csv")
      .then((response) => response.text())
      .then((csvText) => {
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        setCards(parsed.data);
        const cats = parsed.data.reduce((acc, card) => {
          const type = card["Card Type"];
          acc[type] = acc[type] ? [...acc[type], card] : [card];
          return acc;
        }, {});
        setCategories(cats);
      });
  }, []);

  const handleSelect = (type, cardName) => {
    setSelected((prev) => ({
      ...prev,
      [type]: [...prev[type], cardName],
    }));
  };

  const handleRound = () => {
    let employeeCount = 0, revenuePerEmp = 0, expensePerEmp = 0, overheadCost = 0;
    let hires = 0, turnover = 0, excessHires = 0, capital = 0;
    let revenuePct = 0, expensePct = 0, overheadPctRev = 0, overheadPctExp = 0;
    let overheadPerEmp = 0;

    const getCard = (name) => cards.find(c => c["Card Name"] === name);

    selected.Business.forEach(name => {
      const c = getCard(name);
      employeeCount += parseInt(c["Employee Count"] || 0);
      revenuePerEmp += parseFloat(c["Revenue Per Employee"] || 0);
      expensePerEmp += parseFloat(c["Expense Per Employee"] || 0);
      overheadCost += parseFloat(c["Overhead Cost"] || 0);
      hires += parseInt(c["Hires"] || 0);
      turnover += parseInt(c["Turnover"] || 0);
      excessHires += parseInt(c["Excess Hires"] || 0);
    });

    selected.Skill.concat(selected.Resource).concat(selected.Market).forEach(name => {
      const c = getCard(name);
      revenuePct += parseFloat(c["Revenue Per Employee Percentage"] || 0);
      expensePct += parseFloat(c["Expense Per Employee Percentage"] || 0);
      overheadPctRev += parseFloat(c["Overhead Cost Percentage Revenue"] || 0);
      overheadPctExp += parseFloat(c["Overhead Cost Percentage Expense"] || 0);
      overheadPerEmp += parseFloat(c["Overhead Cost Per Employee"] || 0);
      capital += parseFloat(c["Capital"] || 0);
    });

    const employees = hires - turnover + excessHires + employeeCount;
    const revenue = revenuePerEmp * (1 - revenuePct) * employees;
    const expenses = expensePerEmp * (1 - expensePct) * employees;
    const overhead = overheadCost + (revenue * overheadPctRev) + (expenses * overheadPctExp) + (employees * overheadPerEmp);
    const netCapital = capital;

    setMetrics({ employees, revenue, expenses, overhead, netCapital });

    // Reset only market cards
    setSelected((prev) => ({ ...prev, Market: [] }));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Business Simulation Game</h1>

      {["Business", "Skill", "Resource", "Market"].map((type) => (
        <div key={type}>
          <h2>{type} Cards</h2>
          <select onChange={(e) => handleSelect(type, e.target.value)}>
            <option value="">Select a card</option>
            {categories[type]?.map((card, i) => (
              <option key={i} value={card["Card Name"]}>
                {card["Card Name"]}
              </option>
            ))}
          </select>
          <div>Selected: {selected[type].join(", ")}</div>
        </div>
      ))}

      <button onClick={handleRound}>Run Round</button>

      <h2>Metrics</h2>
      <p>Employees: {metrics.employees}</p>
      <p>Revenue: ${metrics.revenue?.toFixed(2)}</p>
      <p>Expenses: ${metrics.expenses?.toFixed(2)}</p>
      <p>Overhead: ${metrics.overhead?.toFixed(2)}</p>
      <p>Net Capital Change: ${metrics.netCapital?.toFixed(2)}</p>
    </div>
  );
};

export default App;