import { useState, type FormEvent } from "react";
export function RegistrationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!name.trim()) {
      setError("请填写姓名");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("请填写可用的邮箱格式");
      return;
    }
    setError("");
    setMessage("字段已通过本地检查；尚未提交、未保存到服务器。");
  }
  function clearFeedback() {
    setError("");
    setMessage("");
  }
  return (
    <form onSubmit={submit} noValidate>
      <h2>报名字段演示</h2>
      <p>仅本地检查，不提供报名服务。请使用虚构测试资料。</p>
      <label htmlFor="name">姓名</label>
      <input
        id="name"
        value={name}
        autoComplete="off"
        aria-describedby="form-error"
        onChange={(event) => {
          setName(event.target.value);
          clearFeedback();
        }}
      />
      <label htmlFor="email">邮箱</label>
      <input
        id="email"
        type="email"
        value={email}
        autoComplete="off"
        aria-describedby="form-error"
        onChange={(event) => {
          setEmail(event.target.value);
          clearFeedback();
        }}
      />
      <p id="form-error" className="error" role="alert">
        {error}
      </p>
      <button type="submit">检查字段</button>
      <p role="status">{message}</p>
    </form>
  );
}
