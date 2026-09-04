import { useEffect, useState } from "react";
import api from "../services/api";

// A signature image needs the Authorization header, which an <img> tag
// cannot send. So we fetch it as a blob and show it via an object URL.
export default function SignatureImage({ voucherId, which, alt }) {
  const [url, setUrl] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    setMissing(false);
    setUrl(null);

    api
      .get(`/vouchers/${voucherId}/signature/${which}`, { responseType: "blob" })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        setUrl(objectUrl);
      })
      .catch(() => setMissing(true));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [voucherId, which]);

  if (url) return <img className="signature-img" src={url} alt={alt || which} />;
  if (missing) return <span className="muted">Not uploaded</span>;
  return <span className="muted">Loading...</span>;
}