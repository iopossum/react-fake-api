import React, { useState, useRef, useImperativeHandle, forwardRef, FocusEvent, memo } from 'react';
import { Drawer, Button, InputNumber, Form, Switch, Space, Row, Col, Input, Select, Divider } from 'antd';
import { Rule } from 'antd/es/form';
import styles from './Edit.module.scss';
const { TextArea } = Input;
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { Route } from '../../../utils/server.types';
import { PromiseRef, LabelValue, GroupsObj, Resolve } from '../../../types/global';
import { EditDrawerProps, EditDrawerHandle } from './Edit.types';

const EditPathDrawer = forwardRef<EditDrawerHandle<Route>, EditDrawerProps<GroupsObj>>(({ groupsRef }, ref) => {

  const dialogRef = useRef<PromiseRef<Route>>({ resolve: null, reject: null });
  const dataRef = useRef<Partial<Route>>({} as Route);

  const [visible, setVisible] = useState<boolean>(false);
  const [newGroups, setNewGroups] = useState<LabelValue[]>([]);
  const [form] = Form.useForm();

  useImperativeHandle(ref, () => ({
    open: (data: Partial<Route>): Promise<Route> => {
      form.resetFields();
      const formData = {...data};
      if (data.custom) {
        formData.custom = JSON.stringify(data.custom, null, 2);
      }
      dataRef.current = {...formData};
      setVisible(true);
      form.setFieldsValue(formData);
      return new Promise<Route>((resolve, reject) => {
        dialogRef.current.resolve = resolve as Resolve<Route>;
        dialogRef.current.reject = reject;
      });
    },
  }));

  const _onClose = (): void => {
    setVisible(false);
  };

  const _onCancel = (): void => {
    _onClose();
    dialogRef.current.reject && dialogRef.current.reject();
  };

  const _onSubmit = async (): Promise<void> => {
    try {
      const data = await form.validateFields() as Route;
      _onClose();
      if (data.custom) {
        data.custom = JSON.parse(data.custom as string);
      }
      data.headers = data.headers || [];
      data.headers = data.headers.map(v => ({
        key: v.key,
        value: v.value
      }));
      dialogRef.current.resolve && dialogRef.current.resolve(data);
    } catch(e) {

    }
  };

  const _onBlurCustom = (e: FocusEvent<HTMLTextAreaElement>): void => {
    try {
      const json = JSON.parse(e.target.value);
      form.setFieldsValue({
        custom: JSON.stringify(json, null, 2),
      });
    } catch (e) {

    }
  };

  const _checkJSON = (_: Rule, value: string): Promise<void> => {
    try {
      JSON.parse(value);
      return Promise.resolve();
    } catch (e) {
      return !!value ? Promise.reject(new Error('JSON is not valid!')) : Promise.resolve();
    }
  };

  const _checkPath = (_: Rule, value: string): Promise<void> => {
    const reg = /(^https?:\/\/.)|(^\/.)/i;
    return reg.test(value) ? Promise.resolve() : Promise.reject(new Error('Path is not valid!'));
  };

  return (
    <Drawer
      width={320}
      closable={true}
      title={dataRef.current.path}
      placement="right"
      onClose={_onClose}
      visible={visible}
      className={styles.drawer}
      closeIcon={null}
      extra={
        <Space>
          <Button onClick={_onCancel} size={'small'}>Cancel</Button>
          <Button type="primary" size={'small'} onClick={_onSubmit}>OK</Button>
        </Space>
      }
    >
      <Form form={form} autoComplete="off" layout={'vertical'}>
        <Row>
          <Col sm={{ span: 15 }}>
            <Form.Item
              label={'Url'}
              name={'path'}
              rules={[
                {
                  validator: _checkPath,
                },
              ]}
            >
              <Input disabled={!!dataRef.current.path} />
            </Form.Item>
          </Col>
          <Col sm={{ offset: 1, span: 8 }}>
            <Form.Item label={'Method'} name={'method'}>
              <Select
                disabled={!!dataRef.current.path}
                allowClear={false}
                options={['get', 'post', 'put', 'patch', 'delete'].map(v => ({ label: v.toUpperCase(), value: v }))}
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
              <Select
                allowClear
                defaultActiveFirstOption={false}
                options={Object.keys(groupsRef.current).filter(v => ['handled', 'undefined'].indexOf(v) === -1).map(v => ({ label: v, value: v })).concat(newGroups)}
                dropdownRender={menu => {
                  const [form] = Form.useForm();
                  const _onAdd = () => {
                    let value = form.getFieldValue('name');
                    value = value ? value.toLowerCase() : '';
                    const filtered = Object.keys(groupsRef.current).filter(v => v === value);
                    if (value && !filtered.length) {
                      setNewGroups(newGroups.concat([{value, label: value}]));
                    }
                  };
                  return (
                    <div>
                      { menu }
                      <Divider style={{ margin: '4px 0' }} />
                      <Form form={form} autoComplete="off">
                        <Row>
                          <Col sm={{ offset: 1, span: 10 }}>
                            <Form.Item name={'name'}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col sm={{ offset: 1, span: 6 }}>
                            <Button type="primary" htmlType="submit" onClick={_onAdd}>
                              <PlusOutlined /> Add item
                            </Button>
                          </Col>
                        </Row>
                      </Form>
                    </div>
                  );
                }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col sm={{ span: 3 }}>
            <Form.Item label={'Error'} name={'error'} valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col sm={{ offset: 3, span: 6 }}>
            <Form.Item label={'Delay (ms)'} name={'delay'}>
              <InputNumber min={0} />
            </Form.Item>
          </Col>
          <Col sm={{ offset: 4, span: 7 }}>
            <Form.Item label={'Status'} name={'status'}>
              <InputNumber min={0} />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col sm={24}>
            <Form.Item
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              name="custom"
              label="Custom response"
              rules={[
                {
                  validator: _checkJSON,
                },
              ]}
            >
              <TextArea
                allowClear
                autoSize={{ minRows: 6, maxRows: 10 }}
                onBlur={_onBlurCustom}
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
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'key']}
                        rules={[{ required: true, message: 'Missing key' }]}
                      >
                        <Input placeholder="Header key" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                        rules={[{ required: true, message: 'Missing value' }]}
                      >
                        <Input placeholder="Header value" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={add} block icon={<PlusOutlined />}>
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
  )
});

export default memo(EditPathDrawer);
