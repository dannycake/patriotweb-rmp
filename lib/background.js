const SCHOOL_ID_NUM = 352;
const SCHOOL_ID = btoa(`School-${SCHOOL_ID_NUM}`);

const GRAPHQL_URL = 'https://ratemyprofessors.danny.ink/graphql';

const SCORE_CACHE = {};

const searchProfessors = (professorName) => new Promise(resolve => {
    fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'accept': 'application/json,*/*',
        },
        body: JSON.stringify({
            query: "query TeacherSearchResultsPageQuery(\n  $query: TeacherSearchQuery!\n  $schoolID: ID\n) {\n  search: newSearch {\n    ...TeacherSearchPagination_search_1ZLmLD\n  }\n  school: node(id: $schoolID) {\n    __typename\n    ... on School {\n      name\n    }\n    id\n  }\n}\n\nfragment TeacherSearchPagination_search_1ZLmLD on newSearch {\n  teachers(query: $query, first: 8, after: \"\") {\n    didFallback\n    edges {\n      cursor\n      node {\n        ...TeacherCard_teacher\n        id\n        __typename\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n    resultCount\n    filters {\n      field\n      options {\n        value\n        id\n      }\n    }\n  }\n}\n\nfragment TeacherCard_teacher on Teacher {\n  id\n  legacyId\n  avgRating\n  numRatings\n  ...CardFeedback_teacher\n  ...CardSchool_teacher\n  ...CardName_teacher\n  ...TeacherBookmark_teacher\n}\n\nfragment CardFeedback_teacher on Teacher {\n  wouldTakeAgainPercent\n  avgDifficulty\n}\n\nfragment CardSchool_teacher on Teacher {\n  department\n  school {\n    name\n    id\n  }\n}\n\nfragment CardName_teacher on Teacher {\n  firstName\n  lastName\n}\n\nfragment TeacherBookmark_teacher on Teacher {\n  id\n  isSaved\n}\n",
            variables: {
                query: {
                    text: professorName,
                    schoolID: SCHOOL_ID,
                    fallback: true,
                    departmentID: null
                }, schoolID: SCHOOL_ID
            }
        }),
    })
        .then(async resp => {
            const json = await resp.json();

            const professors = json.data.search.teachers.edges.map(edge => ({
                id: edge.node.id,
                name: `${edge.node.firstName} ${edge.node.lastName}`,
                difficulty: edge.node.avgDifficulty,
                rating: edge.node.avgRating,
            }));

            return resolve(professors);
        })
        .catch(error => {
            console.error(`Failed to fetch teachers from RateMyProfessors:`, error)
            return resolve();
        });
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const {
        type,
        name
    } = message;

    if (SCORE_CACHE[name]) {
        console.log(`Found cached search for '${name}'`);
        return sendResponse(SCORE_CACHE[name]);
    }

    if (type !== 'search')
        return console.warn('Unexpected payload', message)

    console.log(`Getting score for '${name}' from ${SCHOOL_ID}`);

    (async () => {
        const search = await searchProfessors(name);
        SCORE_CACHE[name] = search;

        sendResponse(search);
    })();

    return true;
});
