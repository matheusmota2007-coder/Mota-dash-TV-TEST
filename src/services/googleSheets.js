import axios from 'axios';

export const fetchSheetData = async (apiUrl, token) => {
    try {
        const response = await axios.get(`${apiUrl}?token=${token}`);
        const { headers, rows } = response.data;

        // Mapeia os dados para um formato que o gráfico entende
        return rows.map(row => {
            let obj = {};
            headers.forEach((h, i) => obj[h] = row[i]);
            return obj;
        });
    } catch (error) {
        console.error("Erro na integração:", error);
        return [];
    }
};