import { Meta, StoryObj } from "@storybook/react";

import { CSSProperties } from "react";

import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
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
} from "antd";

import { IRFAProps, RFA } from "..";

const SPACE_STYLE: CSSProperties = { display: "flex", marginBottom: 8 };
const SELECT_STYLE: CSSProperties = { width: 70 };

const isPassed = (res: Response) =>
  !!res.headers?.get("access-control-allow-headers");

interface INotificationContentProps extends AlertProps {
  spinning?: boolean;
}

const NotificationContent = ({
  spinning,
  type = "info",
  message = "Loading...",
  description,
}: INotificationContentProps) => {
  return (
    <Spin spinning={spinning}>
      <Alert type={type} message={message} description={description} />
    </Spin>
  );
};

export default {
  title: "RFA",
  component: RFA,
} satisfies Meta<typeof RFA>;

const Template = (props: IRFAProps) => {
  const { routes } = props;
  const [form] = Form.useForm();

  const handleSend = ({ name }: { name: number }) => {
    const { routes } = form.getFieldsValue();
    const route = routes[name];
    if (route.path) {
      const method = route.method || "get";
      const notificationHeader = `${method.toUpperCase()}: ${route.path}`;
      notification.open({
        key: name.toString(),
        message: notificationHeader,
        description: <NotificationContent />,
        duration: 0,
      });
      fetch(route.path, {
        method: method.toUpperCase(),
      })
        .then((res) => Promise.resolve(res))
        .catch((res) => Promise.resolve(res))
        .then((res) => {
          const isReqPassed = isPassed(res);
          notification.open({
            key: name.toString(),
            message: `${notificationHeader} - ${isReqPassed ? "PASSED" : "CATCHED"}`,
            description: (
              <NotificationContent
                spinning={false}
                type={res.ok ? "success" : "error"}
                message={`STATUS: ${res.status}`}
                description={
                  !isReqPassed
                    ? JSON.stringify(res._bodyText || "", null, 2)
                    : ""
                }
              />
            ),
            duration: 0,
          });
        });
    }
  };
  return (
    <RFA {...props}>
      <Form
        form={form}
        autoComplete="off"
        layout={"vertical"}
        initialValues={{ routes }}
      >
        <Form.List name="routes">
          {(fields, { add: handleAdd, remove: handleRemove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={SPACE_STYLE} align="baseline">
                  <Form.Item {...restField} name={[name, "method"]}>
                    <Select
                      style={SELECT_STYLE}
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
                  <Button
                    onClick={handleSend.bind(null, { key, name, ...restField })}
                  >
                    Send
                  </Button>
                  <MinusCircleOutlined
                    onClick={handleRemove.bind(null, name)}
                  />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={handleAdd}
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
    </RFA>
  );
};

export const Basic: StoryObj<typeof RFA> = {
  render: Template,
  args: {
    routes: [
      {
        path: "/test",
        method: "get",
        delay: 1000,
        response: () => {
          return 1;
        },
      },
    ],
  },
};
