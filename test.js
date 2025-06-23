async function fetchapi() {
    try {
        const res = await fetch('https://opentdb.com/api.php?amount=3');
        const data = await res.json();

        if (data.response_code !== 0) {
            alert('No se encontraron suficientes preguntas para esta configuración. Por favor, ajusta la configuración.');
            return;
        }

        console.log(data);

    } catch (error) {
        console.error('Error al obtener preguntas:', error);
    }
}

fetchapi();
