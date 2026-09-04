export default function Button() {
  const handleClick = () => console.log('clicked');
  return <button onClick={handleClick}>Submit</button>;
}
