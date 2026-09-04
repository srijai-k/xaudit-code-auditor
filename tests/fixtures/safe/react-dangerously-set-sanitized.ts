import DOMPurify from 'dompurify';
export default function Post({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}
