import { useState, useRef, useImperativeHandle, forwardRef } from "react";

import { Drawer, Button, Form, Space, Row, Col } from "antd";

import { GroupSelect } from "@src/components/group-select";

import { IPromise, IRoute } from "@src/types";

import styles from "../route-edit/route-edit.module.scss";

export interface IGroupEditDrawerProps {
  groups: string[];
}

export interface IGroupEditDrawerHandle {
  open: (group: string) => Promise<IRoute>;
}

export const GroupEditDrawer = forwardRef<
  IGroupEditDrawerHandle,
  IGroupEditDrawerProps
>(({ groups }, ref) => {
  const dialogRef = useRef<IPromise<IRoute>>({ resolve: null, reject: null });
  const dataRef = useRef<Partial<IRoute> | null>(null);

  const [visible, setVisible] = useState(false);

  const [form] = Form.useForm<IRoute>();

  useImperativeHandle(ref, () => ({
    open: (group) => {
      form.resetFields();
      const formData = { group };
      dataRef.current = { group };
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

  const handleSubmit = async () => {
    try {
      const data = await form.validateFields();
      handleClose();
      dialogRef.current.resolve?.(data);
    } catch (e) {}
  };

  return (
    <Drawer
      width={320}
      closable={true}
      title={dataRef.current?.group || "No group"}
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
      </Form>
    </Drawer>
  );
});
