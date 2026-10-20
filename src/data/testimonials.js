// What people said after trying XAUDIT. Quotes are verbatim — edit the
// wording only if the person who said it asks for the change. Everyone here
// is an alum of the school listed; `credit` is the line shown under the name.
export const TESTIMONIALS = [
    {
        name: 'Krishna Donepudi',
        school: 'Carnegie Mellon University',
        quote: 'The decision to remove the scoring system was honestly my favorite part. Most tools want to give you a number that makes you feel like your code is either safe or unsafe, even when things are more complicated than that. Having XAUDIT show you the actual findings and explain the limitations is a much better approach.',
    },
    {
        name: 'Santosh Nukala',
        school: 'University of North Carolina at Chapel Hill',
        quote: 'I could see myself using this when I just want to quickly check a snippet before moving on. You paste the code, get the findings, and can actually understand what triggered them. Not having to upload your code anywhere is a big plus too.',
    },
    {
        name: 'Abhiram Devarapalli',
        school: 'Carnegie Mellon University',
        quote: 'The one hop limit is an interesting engineering decision. It is tempting to make a static analyzer sound like it understands the entire flow of a program, but XAUDIT is explicit about where its analysis stops. I like that the scope is defined clearly and that the tests cover cases where a rule should not fire, not just cases where it should.',
    },
    {
        name: 'Krithik Chitla',
        school: 'University of North Carolina at Chapel Hill',
        quote: 'The privacy angle makes a lot of sense for a tool like this. Developers can be hesitant to paste code into online tools, especially if it belongs to a project they are working on. Running the audit in the browser removes that particular concern, and the PDF and SARIF exports make the results more useful beyond the website itself.',
    },
    {
        name: 'Oliver Wesche',
        school: 'Harvard University',
        quote: 'What I liked most was that XAUDIT does not try to solve everything at once. It has a clear use case, a straightforward way to get value from it, and a pretty deliberate approach to communicating its limitations. I think that kind of focus is harder to get right than it looks, especially when building a technical product from scratch.',
    },
].map((t) => ({ ...t, credit: `${t.school} alum` }));
