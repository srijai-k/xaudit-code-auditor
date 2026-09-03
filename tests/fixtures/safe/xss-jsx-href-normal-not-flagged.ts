export default function UserLink({ username }) {
  return <a href={`/users/${username}`}>{username}</a>;
}
