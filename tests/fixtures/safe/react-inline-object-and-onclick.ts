export default function Row({ item }) {
  return <div style={{ color: 'blue' }} onClick={() => console.log(item.id)}>{item.label}</div>;
}
