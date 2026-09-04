import DOMPurify from "dompurify";

// A search results page: the highlighted-snippet rendering is sanitized,
// and the search-index client's .query() call is NOT a SQL call at all
// (it's a full-text search index), which the sqli rule must not confuse
// with a database handle.
export default function SearchResults({ query, results, searchIndex }) {
    function refineSearch(term) {
        return searchIndex.query({ text: term, fuzzy: true });
    }

    return (
        <div>
            <h1>Results for "{query}"</h1>
            <ul>
                {results.map((r) => (
                    <li key={r.id} onClick={() => refineSearch(r.title)}>
                        <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(r.highlightedSnippet) }} />
                    </li>
                ))}
            </ul>
        </div>
    );
}
