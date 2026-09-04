export default function Form({ onSave }) {
  const handleChange = (e) => console.log(e.target.value);
  const handleSubmit = (e) => { e.preventDefault(); onSave(); };
  return <form onSubmit={handleSubmit}><input onChange={handleChange} /></form>;
}
