import { useState, memo } from "react";

import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Row,
  Col,
  Input,
  Select,
  Divider,
  SelectProps,
} from "antd";

import { ILabelValue } from "@src/types";

export interface IGroupSelectProps extends SelectProps {
  groups: string[];
}

export const GroupSelect = memo(({ groups, ...rest }: IGroupSelectProps) => {
  const [newGroups, setNewGroups] = useState<ILabelValue[]>([]);
  const [form] = Form.useForm<{ name?: string }>();

  const handleAdd = () => {
    let value = form.getFieldValue("name");
    value = value ? value.toLowerCase() : "";
    const filtered = groups.filter((v) => v === value);
    if (value && !filtered.length) {
      setNewGroups(newGroups.concat([{ value, label: value }]));
    }
  };

  return (
    <Select
      allowClear
      defaultActiveFirstOption={false}
      options={groups.map((v) => ({ label: v, value: v })).concat(newGroups)}
      {...rest}
      dropdownRender={(menu) => {
        return (
          <div>
            {menu}
            <Divider style={{ margin: "4px 0" }} />
            <Form form={form} autoComplete="off">
              <Row>
                <Col sm={{ offset: 1, span: 10 }}>
                  <Form.Item name={"name"}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col sm={{ offset: 1, span: 6 }}>
                  <Button type="primary" htmlType="submit" onClick={handleAdd}>
                    <PlusOutlined /> Add item
                  </Button>
                </Col>
              </Row>
            </Form>
          </div>
        );
      }}
    />
  );
});
