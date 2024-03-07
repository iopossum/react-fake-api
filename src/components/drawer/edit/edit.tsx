import { useState, useRef, useImperativeHandle, forwardRef } from "react";

import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import {
  Drawer,
  Button,
  InputNumber,
  Form,
  Switch,
  Space,
  Row,
  Col,
  Input,
  Select,
} from "antd";
import { RuleObject } from "antd/lib/form";
import { TextAreaProps } from "antd/lib/input/TextArea";

import { IPromise, IRoute, METHODS } from "@src/types";

import { GroupSelect } from "./group-select";

import styles from "./edit.module.scss";

const { TextArea } = Input;

export interface IEditDrawerProps {
  groups: string[];
}

export interface IEditDrawerHandle {
  open: (route: Partial<IRoute>) => Promise<IRoute>;
}

export const EditDrawer = forwardRef<IEditDrawerHandle, IEditDrawerProps>(
  ({ groups }, ref) => {
    const dialogRef = useRef<IPromise<IRoute>>({ resolve: null, reject: null });
    const dataRef = useRef<Partial<IRoute> | null>(null);

    const [visible, setVisible] = useState(false);

    const [form] = Form.useForm<IRoute>();

    useImperativeHandle(ref, () => ({
      open: (data) => {
        form.resetFields();
        const formData = { ...data };
        formData.isText = data.isText || false;
        if (data.custom && !formData.isText) {
          formData.custom = JSON.stringify(data.custom, null, 2);
        }
        dataRef.current = { ...data };
        setVisible(true);
        form.setFieldsValue(formData);
        return new Promise<IRoute>((resolve, reject) => {
          dialogRef.current.resolve = resolve;
          dialogRef.current.reject = reject;
        });
      },
    }));

    const handleClose = () => {
      setVisible(false);
    };

    const handleCancel = () => {
      handleClose();
      dialogRef.current.reject?.();
    };

    const handleChangeResponseType = (e: boolean) => {
      form.validateFields({ dirty: true });
      form.setFieldValue("isText", e);
    };

    const handleSubmit = async () => {
      try {
        const data = await form.validateFields();
        handleClose();
        if (data.custom) {
          data.custom = JSON.parse(data.custom as string);
        }
        data.headers = data.headers || [];
        data.headers = data.headers.map((v) => ({
          key: v.key,
          value: v.value,
        }));
        dialogRef.current.resolve?.(data);
      } catch (e) {}
    };

    const handleBlurCustom: TextAreaProps["onBlur"] = (e) => {
      if (!form.getFieldValue("isText")) {
        try {
          const json = JSON.parse(e.target.value);
          form.setFieldsValue({
            custom: JSON.stringify(json, null, 2),
          });
        } catch (e) {}
      } else {
        form.setFieldsValue({
          custom: e.target.value,
        });
      }
    };

    const handleCheckJSON: RuleObject["validator"] = (_, value) => {
      if (!form.getFieldValue("isText")) {
        try {
          JSON.parse(value);
          return Promise.resolve();
        } catch (e) {
          return value
            ? Promise.reject(new Error("JSON is not valid!"))
            : Promise.resolve();
        }
      } else {
        return Promise.resolve();
      }
    };

    const handleCheckPath: RuleObject["validator"] = (_, value) => {
      const reg = /(^https?:\/\/.)|(^\/.)/i;
      return reg.test(value)
        ? Promise.resolve()
        : Promise.reject(new Error("Path is not valid!"));
    };

    return (
      <Drawer
        width={320}
        closable={true}
        title={dataRef.current?.path}
        placement="right"
        onClose={handleClose}
        open={visible}
        className={styles.drawer}
        closeIcon={null}
        forceRender
        extra={
          <Space>
            <Button onClick={handleCancel} size={"small"}>
              Cancel
            </Button>
            <Button type="primary" size={"small"} onClick={handleSubmit}>
              OK
            </Button>
          </Space>
        }
      >
        <Form form={form} autoComplete="off" layout={"vertical"}>
          <Row>
            <Col sm={{ span: 15 }}>
              <Form.Item
                label={"Url"}
                name={"path"}
                rules={[
                  {
                    validator: handleCheckPath,
                  },
                ]}
              >
                <Input disabled={!!dataRef.current?.path} />
              </Form.Item>
            </Col>
            <Col sm={{ offset: 1, span: 8 }}>
              <Form.Item label={"Method"} name={"method"}>
                <Select
                  disabled={!!dataRef.current?.path}
                  allowClear={false}
                  options={METHODS.map((v) => ({
                    label: v.toUpperCase(),
                    value: v,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col sm={24}>
              <Form.Item
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                name="group"
                label="Group"
              >
                <GroupSelect groups={groups} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col sm={{ span: 3 }}>
              <Form.Item label={"Error"} name={"error"} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col sm={{ offset: 3, span: 7 }}>
              <Form.Item label={"Delay (ms)"} name={"delay"}>
                <InputNumber min={0} />
              </Form.Item>
            </Col>
            <Col sm={{ offset: 3, span: 7 }}>
              <Form.Item label={"Status"} name={"status"}>
                <InputNumber min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col sm={24}>
              <Form.Item
                labelCol={{ flex: 1 }}
                name="custom"
                label={
                  <div className={styles.response}>
                    Custom Response
                    <div>
                      <span>json</span>
                      <Form.Item
                        name={"isText"}
                        valuePropName="checked"
                        noStyle
                      >
                        <Switch onChange={handleChangeResponseType} />
                      </Form.Item>
                      <span>text</span>
                    </div>
                  </div>
                }
                rules={[
                  {
                    validator: handleCheckJSON,
                  },
                ]}
              >
                <TextArea
                  allowClear
                  autoSize={{ minRows: 6, maxRows: 30 }}
                  onBlur={handleBlurCustom}
                />
              </Form.Item>
            </Col>
          </Row>
          <p>Headers</p>
          <Row>
            <Col sm={24}>
              <Form.List name="headers">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space
                        key={key}
                        style={{ display: "flex", marginBottom: 8 }}
                        align="baseline"
                      >
                        <Form.Item
                          {...restField}
                          name={[name, "key"]}
                          rules={[{ required: true, message: "Missing key" }]}
                        >
                          <Input placeholder="Header key" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, "value"]}
                          rules={[{ required: true, message: "Missing value" }]}
                        >
                          <Input placeholder="Header value" />
                        </Form.Item>
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
                        Add header
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Col>
          </Row>
        </Form>
      </Drawer>
    );
  },
);
