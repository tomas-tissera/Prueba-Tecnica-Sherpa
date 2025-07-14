import axios from 'axios';

// Función para realizar la búsqueda binaria
const binarySearch = (vault: string[], target: number): string | null => {
    let low = 0;
    let high = vault.length - 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const guess = vault[mid];

        if (mid === target) {
            return guess;
        }

        if (mid < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return null;
};

// Nueva función principal que acepta los parámetros y devuelve la clave final
const findFinalPassword = async (bookTitle: string, claves: string[]): Promise<string | null> => {
    const unlockCode: string = claves[claves.length - 1];
    const endpoint: string = 'https://backend-production-9d875.up.railway.app/api/cipher/challenge';

    try {
        const response = await axios.get(endpoint, {
            params: {
                bookTitle: bookTitle,
                unlockCode: unlockCode
            }
        });

        const { vault, targets } = response.data.challenge;

        let finalPassword = '';
        for (const target of targets) {
            const char = binarySearch(vault, target);
            if (char) {
                finalPassword += char;
            }
        }

        return finalPassword;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Error al completar el desafío:", error.response?.data || error.message);
        } else {
            console.error("Un error inesperado ocurrió:", error);
        }
        return null;
    }
};

// Ejemplo de cómo usar la nueva función
const myClaves = ['NECRO1620']; // Reemplaza 'TU_CLAVE_AQUI' con la clave real.
const myBookTitle = 'Malleus Maleficarum';

findFinalPassword(myBookTitle, myClaves).then(password => {
    if (password) {
        console.log("¡Ritual completado!");
        console.log("La contraseña final del manuscrito es:", password);
    } else {
        console.log("No se pudo obtener la contraseña final.");
    }
});