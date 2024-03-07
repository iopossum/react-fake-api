import { IRFAProps, IRoute } from "react-fake-api";

import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import {
  Select,
  Button,
  Form,
  Space,
  Input,
  notification,
  Spin,
  Alert,
  AlertProps,
  FormListFieldData,
} from "antd";
import { createRoot } from "react-dom/client";

const routes: IRoute[] = [
  {
    path: "/test",
    delay: 1000,
    method: "get",
    response: () => {
      return 1;
    },
  },
];

const isPassed = (res: Response) => res && res.headers?.get("x-powered-by");

const NotificationContent = ({
  spinning,
  type = "info",
  message = "Loading...",
  description,
}: AlertProps & { spinning?: boolean }) => {
  return (
    <Spin spinning={spinning}>
      <Alert type={type} message={message} description={description} />
    </Spin>
  );
};

const App = () => {
  const [form] = Form.useForm();
  const _onSend = ({ name }: { name: number }) => {
    const { routes } = form.getFieldsValue();
    const _route = routes[name];
    if (_route.path) {
      const _method = _route.method || "get";
      const _notificationHeader = `${_method.toUpperCase()}: ${_route.path}`;
      notification.open({
        key: name.toString(),
        message: _notificationHeader,
        description: <NotificationContent />,
        duration: 0,
      });
      fetch(_route.path, {
        method: _method.toUpperCase(),
      })
        .then((res) => Promise.resolve(res))
        .catch((res) => Promise.resolve(res))
        .then((res) => {
          const _isPassed = isPassed(res);
          notification.open({
            key: name.toString(),
            message: `${_notificationHeader} - ${_isPassed ? "PASSED" : "CATCHED"}`,
            description: (
              <NotificationContent
                spinning={false}
                type={res.ok ? "success" : "error"}
                message={`STATUS: ${res.status}`}
                description={
                  !_isPassed ? JSON.stringify(res._bodyText || "", null, 2) : ""
                }
              />
            ),
            duration: 0,
          });
        });
    }
  };
  return (
    <>
      <Form
        form={form}
        autoComplete="off"
        layout={"vertical"}
        initialValues={{ routes }}
      >
        <Form.List name="routes">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }: FormListFieldData) => (
                <Space
                  key={key}
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item {...restField} name={[name, "method"]}>
                    <Select
                      style={{ width: 70 }}
                      allowClear={false}
                      options={["get", "post", "put", "patch", "delete"].map(
                        (v) => ({ label: v.toUpperCase(), value: v }),
                      )}
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "path"]}
                    rules={[{ required: true, message: "Missing path" }]}
                  >
                    <Input placeholder="path" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "body"]}>
                    <Input placeholder="body" />
                  </Form.Item>
                  <Button onClick={() => _onSend({ name, ...restField })}>
                    Send
                  </Button>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={add}
                  block
                  icon={<PlusOutlined />}
                >
                  Add path
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </>
  );
};

if (process.env.NODE_ENV === "development") {
  const cfg: IRFAProps = {
    routes,
    storageName: "mirage",
  };
  const RFA = require("react-fake-api");
  type ModuleType = typeof RFA;
  const load = (): Promise<ModuleType> => {
    return import("react-fake-api");
  };
  (async () => {
    const Module = await load();
    const RFA = Module.default;
    createRoot(document.getElementById("root")!).render(
      <RFA {...cfg}>
        <App />
      </RFA>,
    );
  })();
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
