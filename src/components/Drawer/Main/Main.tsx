import React, { useMemo, useState, useLayoutEffect, useEffect, useRef, useImperativeHandle, forwardRef, memo } from 'react';
import { makeServer, getLSItem, setLSItem, deleteLSItem } from "../../../utils/server";
import { Dropdown, Menu, Drawer, List, Checkbox, Tag, Collapse, Tooltip, Space, Badge, notification } from 'antd';
import styles from './Main.module.scss';
import { groupBy, reduce } from 'lodash-es';
const { Panel } = Collapse;
import { DownSquareTwoTone, BulbTwoTone, EditTwoTone, SettingTwoTone, WarningTwoTone, InfoCircleTwoTone } from '@ant-design/icons';
import { CleanConfirm } from '../../Confirm';
import { EditPathDrawer } from '../Edit';
import { EditDrawerHandle } from '../Edit/Edit.types';
import {
  StorageCfg,
  GroupsObj
} from '../../../types/global';
import {
  Route,
  Method,
  MirageExtendedRequest,
  Server,
  Passthrough
} from '../../../utils/server.types';
import { MainDrawerProps, MainDrawerHandle } from './Main.types';
import type { MenuProps } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];


const getPathKey = (v: Route): string => `${v.method || 'get'}_${v.path}`;

const getMethodColor = (method: Method): string => {
  let color = 'success';
  switch (method) {
    case 'post':
    case 'put':
    case 'patch':
      color = 'processing';
      break;
    case 'delete':
      color = 'warning';
      break;
  }
  return color;
};

const waitResponse = (request: MirageExtendedRequest): Promise<string> => {
  let i = 0;
  return new Promise<string>((resolve, reject) => {
    if (request.readyState === 4) {
      resolve(request.responseText);
      return false;
    }
    const interval = setInterval(() => {
      if (request.readyState === 4) {
        resolve(request.responseText);
        clearInterval(interval);
        return false;
      }
      if (i < 90) {
        i++;
      } else {
        clearInterval(interval);
        reject();
      }
      return false;
    }, 1000);
  });
}

const reduceFromGroup = (groupsRefValue: GroupsObj): Route[] => {
  return reduce(Object.values(groupsRefValue), (sum, v) => {
    return sum.concat(v);
  }, [] as Route[]);
};

const defaultConfig: StorageCfg = {
  autoHandle: false,
  routes: []
};

const MainDrawer = forwardRef<MainDrawerHandle, MainDrawerProps<Route>>(({ saveHandled = true, defaultHost, storageName = 'rfa', routes = [],  showNotification, ...rest }, ref) => {

  const [items, setItems] = useState<Route[]>(routes.map((v) => ({
    ...v,
    method: v.method || 'get',
    color: getMethodColor(v.method)
  })));
  const [visible, setVisible] = useState<boolean>(false);
  const [autoHandle, setAutoHandle] = useState<boolean>(defaultConfig.autoHandle);

  const serverRef = useRef<Server>();
  const groupsRef = useRef<GroupsObj>({});
  const editRouteDrawerRef = useRef<EditDrawerHandle<Route>>(null);
  groupsRef.current = groupBy(items, 'group');

  const settingsMenuItems: MenuItem[] = useMemo(() => {
    return [
      { label: 'Add', key: 'add' },
      { label: 'Clear cache', key: 'cache' },
      { label: autoHandle ? 'Disable auto handle' : 'Enable auto handle', key: 'autoHandle' },
      { label: 'Export', key: 'export' },
    ];
  }, [autoHandle, items]);

  const passthrough: Passthrough = (urls): boolean => {
    const request = urls as MirageExtendedRequest;
    const item: Route = {
      path: request.url.replace(/\?.{1,}/g, '').replace(defaultHost || window.location.host, ''),
      method: request.method.toLowerCase() as Method
    };
    let _items = reduceFromGroup(groupsRef.current);
    const filtered = _items.filter(v => v.path === item.path && v.method === item.method)
    if (!filtered.length) {
      if (autoHandle) {
        waitResponse(request)
          .then(res => {
            let json;
            try {
              json = JSON.parse(res);
            } catch (e) {
              json = res;
            }
            if (json) {
              item.custom = json;
              item.group = 'handled';
              item.type = 'handled';
              item.color = getMethodColor(item.method);
              item.status = request.status;
              _items = reduceFromGroup(groupsRef.current);
              _items.push(item);
              setItems(_items);
            }
          })
          .catch(() => {
            console.warn(`${request.url} - Timeout`);
          });
      }
      return true;
    }
    const _checked = filtered[0].checked;
    if (_checked && showNotification) {
      notification.info({
        message: undefined,
        key: filtered[0].path,
        description: `${filtered[0].method.toUpperCase()}: ${filtered[0].path} catched`,
      });
    }
    return !_checked;
  };

  const _onHideDrawer = (): void => {
    setVisible(false);
  };

  const _onChangeActive = (group: string, index: number): void => {
    groupsRef.current[group][index].checked = !groupsRef.current[group][index].checked;
    setItems(reduceFromGroup(groupsRef.current));
  };

  const _onCleanDelay = (group: string, index: number): void => {
    delete groupsRef.current[group][index].delay;
    setItems(reduceFromGroup(groupsRef.current));
  };

  const _onCleanError = (group: string, index: number): void => {
    groupsRef.current[group][index].error = false;
    setItems(reduceFromGroup(groupsRef.current));
  };

  const _onCleanCustom = (group: string, index: number): void => {
    delete groupsRef.current[group][index].custom;
    setItems(reduceFromGroup(groupsRef.current));
  };

  const _onAutoHandleChange = (): void => {
    setAutoHandle(!autoHandle);
  };

  const _onExport = async (): Promise<void> => {
    const blob = new Blob([JSON.stringify(items, null, 2)],{type:'application/json'});
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${storageName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const _onAdd = async (): Promise<void> => {
    const item: Partial<Route> = {
      type: 'manual',
      method: 'get'
    };
    if (editRouteDrawerRef.current) {
      try {
        const data = await editRouteDrawerRef.current.open(item) || {} as Route;
        const group = data.group || 'undefined';
        data.type = item.type;

        data.color = getMethodColor(data.method);
        groupsRef.current[group] = groupsRef.current[group] || [];
        groupsRef.current[group].push(data);
        setItems(reduceFromGroup(groupsRef.current));
      } catch (e) {
      }
    }
  };

  const _onEdit = async (group: string, index: number): Promise<void> => {
    if (editRouteDrawerRef.current) {
      try {
        const data = await editRouteDrawerRef.current.open(groupsRef.current[group][index]);
        Object.assign(groupsRef.current[group][index], data);
        setItems(reduceFromGroup(groupsRef.current));
      } catch (e) {
      }
    }
  };

  const _onDelete = (group: string, index: number): void => {
    groupsRef.current[group].splice(index, 1);
    setItems(reduceFromGroup(groupsRef.current));
  };

  const _onSettingsMenuItemClick: MenuProps['onClick'] = e => {
    switch (e.key) {
      case 'add':
        _onAdd();
        break;
      case 'cache':
        deleteLSItem(storageName)
        break;
      case 'autoHandle':
        setTimeout(_onAutoHandleChange, 500);
        break;
      case 'export':
        _onExport();
        break;
    }
  };

  useEffect(() => {
    serverRef.current && serverRef.current.shutdown();
    serverRef.current = makeServer({ defaultHost, passthrough, routes: items, ...rest });
    setLSItem(storageName, { autoHandle, routes: saveHandled ? items : items.filter(v => v.group !== 'handled') });
  }, [autoHandle, items]);

  useLayoutEffect(() => {
    const settings = getLSItem<StorageCfg>(storageName) || {...defaultConfig};
    setAutoHandle(!!settings.autoHandle);
    const storageRoutes = settings.routes || [];
    const storageRoutesObj = {} as Record<string, Route>;
    storageRoutes.forEach(v => {
      const key = getPathKey(v);
      if (!storageRoutesObj[key]) {
        storageRoutesObj[key] = v;
      }
    });
    let isChanged = storageRoutes.length > 0;
    items.forEach(v => {
      const key = getPathKey(v);
      if (storageRoutesObj[key]) {
        Object.assign(v, storageRoutesObj[key]);
        delete storageRoutesObj[key];
        isChanged = true;
      }
    });
    const newItems = isChanged ? items.concat(Object.values(storageRoutesObj).filter(v => !!v.type)) : items;
    if (isChanged) {
      setItems(newItems);
    }
    serverRef.current = makeServer({ defaultHost, passthrough, routes: newItems, ...rest });
    return () => {
      serverRef.current && serverRef.current.shutdown();
    }
  }, []);

  useImperativeHandle(ref, () => ({
    open: () => {
      setVisible(true);
    },
  }));

  return (
    <Drawer
      title="API"
      placement="right"
      className={styles.drawer}
      onClose={_onHideDrawer}
      visible={visible}
      extra={
        <Space>
          <Dropdown
            overlay={(
              <Menu items={settingsMenuItems} onClick={_onSettingsMenuItemClick} />
            )}
            trigger={["click"]}
          >
            <DownSquareTwoTone />
          </Dropdown>
        </Space>
      }
    >
      <Collapse defaultActiveKey={Object.keys(groupsRef.current).length ? [Object.keys(groupsRef.current)[0]] : []}>
        { Object.keys(groupsRef.current).map((group) => (
          <Panel header={`${group === 'undefined' ? 'No group' : group} (${groupsRef.current[group].filter(v => v.checked).length}/${groupsRef.current[group].length})`} key={group}>
            <List
              itemLayout="horizontal"
              dataSource={groupsRef.current[group]}
              renderItem={(item, index) => {
                const actions = [];
                const _onClick: MenuProps['onClick'] = e => {
                  switch (e.key) {
                    case 'edit':
                      _onEdit(group, index);
                      break;
                    case 'delete':
                      _onDelete(group, index)
                      break;
                  }
                };
                const menuItems: MenuItem[] = [
                  { label: 'Edit', key: 'edit' },
                ];
                if (['handled', 'manual'].indexOf(item.type as string) > -1) {
                  menuItems.push({ label: 'Delete', key: 'delete' });
                }
                if (!!item.delay) {
                  actions.push((
                    <CleanConfirm onConfirm={() => _onCleanDelay(group, index)}>
                      <Tooltip title={'Response delay'}>
                        <span className={styles.delay}>{ item.delay }ms</span>
                      </Tooltip>
                    </CleanConfirm>
                  ));
                }
                if (!!item.error) {
                  actions.push((
                    <CleanConfirm onConfirm={() => _onCleanError(group, index)}>
                      <Tooltip title={'Response error'}>
                        <WarningTwoTone twoToneColor="red" />
                      </Tooltip>
                    </CleanConfirm>
                  ));
                }
                if (!!item.status && item.status !== 200) {
                  actions.push((
                    <Tooltip title={'Response status'}>
                      { item.status >= 400 ? <Tag color="error">{ item.status }</Tag> : <span className={styles.delay}>{ item.status }</span> }
                    </Tooltip>
                  ));
                }
                if (!!item.custom) {
                  actions.push((
                    <CleanConfirm onConfirm={() => _onCleanCustom(group, index)} disabled={item.type === 'handled'}>
                      <Tooltip title={'Custom response'} placement="topRight">
                        <InfoCircleTwoTone />
                      </Tooltip>
                    </CleanConfirm>
                  ));
                }
                actions.push((
                  <Dropdown
                    overlay={(
                      <Menu items={menuItems} onClick={_onClick} />
                    )}
                    trigger={["click"]}
                  >
                    <SettingTwoTone />
                  </Dropdown>
                ));
                let badgeIcon = null;
                switch (item.type) {
                  case 'handled':
                    badgeIcon = <BulbTwoTone className={styles.badge} />;
                    break;
                  case 'manual':
                    badgeIcon = <EditTwoTone className={styles.badge} />;
                    break;
                }
                return (
                  <List.Item
                    actions={actions}
                  >
                    <Checkbox
                      checked={item.checked}
                      onChange={() => _onChangeActive(group, index)}
                    >
                      <Badge count={badgeIcon} color={'blue'}><Tag color={item.color}>{ item.method.toUpperCase() }</Tag></Badge> { item.path }
                    </Checkbox>
                  </List.Item>
                );
              }}
            />
          </Panel>
        )) }
      </Collapse>
      <EditPathDrawer ref={editRouteDrawerRef} groupsRef={groupsRef} />
    </Drawer>
  )
});

export default memo(MainDrawer);
