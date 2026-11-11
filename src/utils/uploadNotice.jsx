import { Checkbox, Modal } from "antd";

const KEY = "admin_hide_same_image_notice";

const hidden = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * For Upload.beforeUpload on menu / restaurant images: tells the admin that an image whose file name already
 * exists in Cloudinary is reused instead of uploaded again. "Don't show again" is remembered in this browser only.
 */
export const sameImageNotice = () => {
  if (!hidden()) {
    let skip = false;
    Modal.info({
      title: "Same file name = same image",
      okText: "Got it",
      content: (
        <div>
          <p style={{ marginBottom: 12 }}>
            If an image with the same file name is already in Cloudinary, it will be reused and not uploaded again. Rename the file if
            this is a different picture.
          </p>
          <Checkbox onChange={(e) => (skip = e.target.checked)}>Never show this again</Checkbox>
        </div>
      ),
      onOk: () => {
        if (!skip) return;
        try {
          localStorage.setItem(KEY, "1");
        } catch {
          /* browser blocks storage: the notice just shows again next time */
        }
      },
    });
  }
  return false; // keep the file in the form, the upload happens on save
};
