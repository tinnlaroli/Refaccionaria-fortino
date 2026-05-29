import { useEffect } from "react";
import { SITE } from "../config/site";

type Props = {
  title: string;
  description?: string;
};

export function PageHead({ title, description }: Props) {
  useEffect(() => {
    document.title = `${title} · ${SITE.name}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && description) {
      meta.setAttribute("content", description);
    }
  }, [title, description]);

  return null;
}
