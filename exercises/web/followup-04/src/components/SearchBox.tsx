type Props = { value: string; onChange: (value: string) => void };
export function SearchBox({ value, onChange }: Props) {
  return (
    <label>
      搜索活动
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
