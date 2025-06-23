
const categorySelect = document.getElementById('category');

async function fetchCategories() {
    try {
        const res = await fetch('https://opentdb.com/api_category.php');
        const data = await res.json();
        categories = data.trivia_categories;
        createCategories();
    } catch (error) {
        console.error('Error in fetchCategories():', error);
    }
}

function createCategories() {
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
    });
}

fetchCategories();