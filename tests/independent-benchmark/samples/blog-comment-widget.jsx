import DOMPurify from "dompurify";
import { useState } from "react";

// Realistic small comment widget: one sink is sanitized, one isn't, and
// there are several ordinary JSX event handlers mixed in that must never
// be mistaken for a security-relevant sink.
export default function CommentThread({ comments, onReply }) {
    const [replyText, setReplyText] = useState("");

    function handleChange(e) {
        setReplyText(e.target.value);
    }

    function handleSubmit(e) {
        e.preventDefault();
        onReply(replyText);
        setReplyText("");
    }

    return (
        <div className="comment-thread">
            {comments.map((comment) => (
                <article key={comment.id} onClick={() => console.log("viewed", comment.id)}>
                    <header>{comment.author}</header>
                    {/* Rendered as rich text the author composed with a WYSIWYG editor. */}
                    <div
                        className="comment-body"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.bodyHtml) }}
                    />
                    {/* A second, legacy rendering path for quoted replies that was never updated to sanitize. */}
                    <blockquote
                        dangerouslySetInnerHTML={{ __html: comment.quotedHtml }}
                    />
                </article>
            ))}
            <form onSubmit={handleSubmit}>
                <textarea value={replyText} onChange={handleChange} />
                <button type="submit">Reply</button>
            </form>
        </div>
    );
}
