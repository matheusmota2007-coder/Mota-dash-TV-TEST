import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis,
    Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import axios from 'axios';

const Card = ({ title, children }) => (
    <div className="bg-mota-panel p-4 rounded-xl shadow-2xl border border-slate-700/50 flex flex-col h-100">
        <h3 className="text-slate-400 text-sm font-bold uppercase mb-4 text-center">{title}</h3>
        <div className="grow">{children}</div>
    </div>
);

const Dashboard = ({ config }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${config.apiUrl}?token=${config.token}`);
                const { headers, rows } = response.data;

                // Transformando os dados brutos em objetos legíveis pelo gráfico
                const formatted = rows.map(row => {
                    let obj = {};
                    headers.forEach((h, i) => {
                        // Tratamento básico para converter strings numéricas
                        let val = row[i];
                        if (typeof val === 'string') {
                            val = val.replace('%', '').replace(',', '.');
                            if (!isNaN(val) && val !== '') val = parseFloat(val);
                        }
                        obj[h] = val;
                    });
                    return obj;
                });
                setData(formatted);
            } catch (err) {
                console.error("Erro ao carregar dados:", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 300000); // Atualiza a cada 5 min
        return () => clearInterval(interval);
    }, [config]);

    return (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-mota-dark min-h-screen">

            {/* 1. Utilização de Máquina (Linha) */}
            <Card title="Utilização de Máquina (%)">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="data" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} unit="%" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                        <Line type="monotone" dataKey="utilização de Maquina" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {/* 2. Peças Fabricadas (Barras) */}
            <Card title="Peças Fabricadas">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="data" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                        <Bar dataKey="Peças Fabric." fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            {/* 3. Status: Funcionando vs Parado (Barras Empilhadas) */}
            <Card title="Horas Func. / Parado">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="data" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                        <Legend />
                        <Bar dataKey="Funcionando" stackId="a" fill="#22c55e" />
                        <Bar dataKey="Parado" stackId="a" fill="#ef4444" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            {/* 4. TC Médio (Linha) */}
            <Card title="TC Médio (min/peça)">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="data" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                        <Line type="monotone" dataKey="TC Médio" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

        </div>
    );
};

export default Dashboard;
