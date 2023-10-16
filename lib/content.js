const similarity = (s1, s2) => {
    const longer = s1;
    const shorter = s2;

    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;

    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}
const editDistance = (s1, s2) => {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }

        if (i > 0)
            costs[s2.length] = lastValue;
    }

    return costs[s2.length];
}

const searchTeachers = (name) => new Promise(resolve => {
    chrome.runtime.sendMessage({
        type: 'search',
        name,
    }, response => {
        return resolve(response)
    });
});

const MAX_COLOR = '42ff00';
const MIN_COLOR = 'f56767';
const generateColor = (score) => {
    const r = parseInt(MAX_COLOR.substring(0, 2), 16);
    const g = parseInt(MAX_COLOR.substring(2, 4), 16);
    const b = parseInt(MAX_COLOR.substring(4, 6), 16);

    const r2 = parseInt(MIN_COLOR.substring(0, 2), 16);
    const g2 = parseInt(MIN_COLOR.substring(2, 4), 16);
    const b2 = parseInt(MIN_COLOR.substring(4, 6), 16);

    const ratio = score / 5;

    const r3 = Math.round(r * ratio + r2 * (1 - ratio));
    const g3 = Math.round(g * ratio + g2 * (1 - ratio));
    const b3 = Math.round(b * ratio + b2 * (1 - ratio));

    return `#${r3.toString(16)}${g3.toString(16)}${b3.toString(16)}`;
}

const markEmails = async () => {
    for (const email of
        [...document.getElementsByTagName('a')]
            .filter(el => el.href.includes('mailto:'))) {

        const parent = email.parentElement;

        if (email.classList.contains('dnyink-extension') &&
            parent.innerHTML.includes('dnyink-score')) {
            continue;
        }
        email.classList.add('dnyink-extension');

        // email.style.marginRight = '5px';

        const scoreDisplay = document.createElement('div');
        scoreDisplay.innerText = 'N/A';

        scoreDisplay.style = {
            background: '#b9b9b9',
            display: 'inline-block',
            borderRadius: '5px',
            padding: '0 2px',
            margin: '0',
            cursor: 'pointer',
            color: 'black',
            width: 'fit-content',
            'min-width': '7em',
            'text-align': 'center'
        }

        scoreDisplay.classList.add('dnyink-score');

        const teacherName =
            email.innerText
                .split(', ')
                .reverse()
                .join(' ');

        let url =
            `https://www.ratemyprofessors.com/search/professors/352?q=${encodeURIComponent(teacherName)}`;

        const teachers = await searchTeachers(teacherName) ?? [];
        const teacher =
            teachers.find(teacher => similarity(teacher.name, teacherName) > 0.8);

        if (teacher && !(
            teacher.rating === 0 &&
            teacher.difficulty === 0
        )) {
            const parsedId = atob(teacher.id).split('-')[1];
            url = `https://www.ratemyprofessors.com/professor/${parsedId}`;

            scoreDisplay.innerText = `🌟 ${teacher.rating}, 📋 ${teacher.difficulty}`;
            scoreDisplay.style.background = generateColor(
                (teacher.rating + (5 - teacher.difficulty)) / 2
            );
        }

        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.style.textDecoration = 'none';
        link.style.display = 'inline-block';

        parent.appendChild(link);
        link.appendChild(scoreDisplay);
    }
}

(async () => {
    for (; ;) {
        await markEmails()
        await new Promise(resolve => setTimeout(resolve, 100));
    }
})();
