import {
  useMemo,
  useState,
  useLayoutEffect,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  memo,
} from "react";

import {
  DownSquareTwoTone,
  BulbTwoTone,
  EditTwoTone,
  SettingTwoTone,
  WarningTwoTone,
  InfoCircleTwoTone,
} from "@ant-design/icons";
import {
  Dropdown,
  MenuProps,
  Drawer,
  List,
  Checkbox,
  Tag,
  Collapse,
  Tooltip,
  Space,
  Badge,
  notification,
} from "antd";
import { groupBy } from "lodash-es";

import { CleanConfirm } from "@src/components/confirm2";
import {
  IRoute,
  IStorageCfg,
  ROUTE_TYPES,
  IMirageExtendedRequest,
  TMethod,
} from "@src/types";
import { getLSItem, setLSItem, deleteLSItem } from "@src/utils/ls";
import { makeServer, IFakeServerProps } from "@src/utils/server";

import { EditDrawer, IEditDrawerHandle } from "../edit2";

import {
  getPathKey,
  getMethodColor,
  waitResponse,
  convertRoutes,
} from "./utils";

import styles from "./main.module.scss";

const DEFAULT_CONFIG: IStorageCfg = {
  autoHandle: false,
  routes: [],
} as const;

type TMenuItem = Required<MenuProps>["items"][number];

interface IRouteExtended extends IRoute {
  index: number;
}

export interface IMainDrawerProps {
  serverProps?: Omit<IFakeServerProps, "passthrough" | "routes">;
  storageName?: string;
  routes?: IRoute[];
  showNotification?: boolean;
  saveHandled?: boolean;
}

export interface IMainDrawerHandle {
  open: () => void;
}

export const MainDrawer = memo(
  forwardRef<IMainDrawerHandle, IMainDrawerProps>(
    (
      {
        saveHandled = true,
        serverProps,
        storageName = "rfa",
        routes = [],
        showNotification,
      },
      ref,
    ) => {
      const editRouteDrawerRef = useRef<IEditDrawerHandle>(null);
      const serverRef = useRef<ReturnType<typeof makeServer>>();

      const [items, setItems] = useState<IRouteExtended[]>(() =>
        convertRoutes(routes),
      );
      const [visible, setVisible] = useState(false);
      const [autoHandle, setAutoHandle] = useState(DEFAULT_CONFIG.autoHandle);

      const { defaultHost } = serverProps || {};

      const settingsMenuItems: TMenuItem[] = useMemo(() => {
        return [
          { label: "Add", key: "add" },
          { label: "Clear cache", key: "cache" },
          {
            label: autoHandle ? "Disable auto handle" : "Enable auto handle",
            key: "autoHandle",
          },
          { label: "Export", key: "export" },
        ];
      }, [autoHandle]);

      const routesByGroup = useMemo(() => {
        const grouped = groupBy(
          items.map((v, i) => ({ ...v, index: i })),
          "group",
        );
        return {
          captions: Object.keys(grouped),
          groups: grouped,
        };
      }, [items]);

      const passthrough = useCallback<IFakeServerProps["passthrough"]>(
        (urls) => {
          const request = urls as IMirageExtendedRequest;
          const item: IRoute = {
            path: request.url
              .replace(/\?.{1,}/g, "")
              .replace(defaultHost || window.location.host, ""),
            method: request.method.toLowerCase() as TMethod,
          };
          const filtered = items.filter(
            (v) => v.path === item.path && v.method === item.method,
          );
          if (!filtered.length) {
            if (autoHandle) {
              waitResponse(request)
                .then((res) => {
                  let json;
                  try {
                    json = JSON.parse(res);
                  } catch (e) {
                    json = res;
                  }
                  if (json) {
                    item.custom = json;
                    item.group = "handled";
                    item.type = "handled";
                    item.color = getMethodColor(item.method);
                    item.status = request.status;
                    setItems((prev) => [
                      ...prev,
                      { ...item, index: prev.length },
                    ]);
                  }
                })
                .catch(() => {
                  /* eslint-disable-next-line no-console */
                  console.warn(`${request.url} - Timeout`);
                });
            }
            return true;
          }
          const checked = filtered[0].checked;
          if (checked && showNotification) {
            notification.info({
              message: undefined,
              key: filtered[0].path,
              description: `${filtered[0].method.toUpperCase()}: ${filtered[0].path} catched`,
            });
          }
          return !checked;
        },
        [autoHandle, defaultHost, showNotification, items],
      );

      const handleHideDrawer = () => {
        setVisible(false);
      };

      const handleChangeActive = (item: IRouteExtended) => {
        items[item.index].checked = !items[item.index].checked;
        setItems([...items]);
      };

      const handleCleanDelay = (item: IRouteExtended) => {
        delete items[item.index].delay;
        setItems([...items]);
      };

      const handleCleanError = (item: IRouteExtended) => {
        items[item.index].error = false;
        setItems([...items]);
      };

      const handleCleanCustom = (item: IRouteExtended) => {
        delete items[item.index].custom;
        setItems([...items]);
      };

      const handleAutoHandleChange = () => {
        setAutoHandle(!autoHandle);
      };

      const handleExport = async () => {
        const blob = new Blob([JSON.stringify(items, null, 2)], {
          type: "application/json",
        });
        const href = await URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = href;
        link.download = `${storageName}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      const handleAdd = async () => {
        const item: Partial<IRoute> = {
          type: "manual",
          method: "get",
        };
        if (editRouteDrawerRef.current) {
          try {
            const data =
              (await editRouteDrawerRef.current.open(item)) || ({} as IRoute);
            data.type = item.type;

            data.color = getMethodColor(data.method);
            setItems([...items, { ...data, index: items.length }]);
          } catch (e) {}
        }
      };

      const handleEdit = async (item: IRouteExtended) => {
        if (editRouteDrawerRef.current) {
          try {
            const data = await editRouteDrawerRef.current.open(
              items[item.index],
            );
            Object.assign(items[item.index], data);
            setItems([...items]);
          } catch (e) {}
        }
      };

      const handleDelete = (item: IRouteExtended) => {
        items.splice(item.index, 1);
        setItems([...items]);
      };

      const handleSettingsMenuItemClick: MenuProps["onClick"] = (e) => {
        switch (e.key) {
          case "add":
            handleAdd();
            break;
          case "cache":
            deleteLSItem(storageName);
            break;
          case "autoHandle":
            setTimeout(handleAutoHandleChange, 500);
            break;
          case "export":
            handleExport();
            break;
        }
      };

      useEffect(() => {
        serverRef.current?.shutdown();
        serverRef.current = makeServer({
          defaultHost,
          passthrough,
          routes: items,
          ...serverProps,
        });
        setLSItem(storageName, {
          autoHandle,
          routes: saveHandled
            ? items
            : items.filter((v) => v.group !== "handled"),
        });
      }, [
        autoHandle,
        defaultHost,
        saveHandled,
        storageName,
        items,
        serverProps,
        passthrough,
      ]);

      useLayoutEffect(() => {
        const settings = getLSItem<IStorageCfg>(storageName) || {
          ...DEFAULT_CONFIG,
        };
        setAutoHandle(!!settings.autoHandle);
        const storageRoutes = settings.routes || [];
        const storageRoutesObj = {} as Record<string, IRoute>;
        storageRoutes.forEach((v) => {
          const key = getPathKey(v);
          if (!storageRoutesObj[key]) {
            storageRoutesObj[key] = v;
          }
        });
        let isChanged = storageRoutes.length > 0;
        const inputRoutes = convertRoutes(routes);
        inputRoutes.forEach((v) => {
          const key = getPathKey(v);
          if (storageRoutesObj[key]) {
            Object.assign(v, storageRoutesObj[key]);
            delete storageRoutesObj[key];
            isChanged = true;
          }
        });
        const newItems = isChanged
          ? inputRoutes.concat(
              Object.values(storageRoutesObj)
                .filter((v) => !!v.type)
                .map((v, i) => ({ ...v, index: inputRoutes.length + i })),
            )
          : inputRoutes;
        if (isChanged) {
          setItems(newItems);
        }
      }, [routes, storageName]);

      useImperativeHandle(ref, () => ({
        open: () => {
          setVisible(true);
        },
      }));

      return (
        <Drawer
          title="API"
          width={Math.min(500, window.innerWidth)}
          placement="right"
          className={styles.drawer}
          onClose={handleHideDrawer}
          open={visible}
          extra={
            <Space>
              <Dropdown
                menu={{
                  items: settingsMenuItems,
                  onClick: handleSettingsMenuItemClick,
                }}
                trigger={["click"]}
              >
                <DownSquareTwoTone />
              </Dropdown>
            </Space>
          }
        >
          <Collapse
            defaultActiveKey={
              routesByGroup.captions.length ? [routesByGroup.captions[0]] : []
            }
            items={routesByGroup.captions.map((group) => ({
              key: group,
              label: `${group === "undefined" ? "No group" : group} (${routesByGroup.groups[group].filter((v) => v.checked).length}/${routesByGroup.groups[group].length})`,
              children: (
                <List
                  itemLayout="horizontal"
                  dataSource={routesByGroup.groups[group]}
                  renderItem={(item) => {
                    const actions = [];
                    const handleClick: MenuProps["onClick"] = (e) => {
                      switch (e.key) {
                        case "edit":
                          handleEdit(item);
                          break;
                        case "delete":
                          handleDelete(item);
                          break;
                      }
                    };
                    const menuItems: TMenuItem[] = [
                      { label: "Edit", key: "edit" },
                    ];
                    if (ROUTE_TYPES.indexOf(item.type!) > -1) {
                      menuItems.push({ label: "Delete", key: "delete" });
                    }
                    if (item.delay) {
                      actions.push(
                        <CleanConfirm onConfirm={() => handleCleanDelay(item)}>
                          <Tooltip title={"Response delay"}>
                            <span className={styles.delay}>{item.delay}ms</span>
                          </Tooltip>
                        </CleanConfirm>,
                      );
                    }
                    if (item.error) {
                      actions.push(
                        <CleanConfirm onConfirm={() => handleCleanError(item)}>
                          <Tooltip title={"Response error"}>
                            <WarningTwoTone twoToneColor="red" />
                          </Tooltip>
                        </CleanConfirm>,
                      );
                    }
                    if (!!item.status && item.status !== 200) {
                      actions.push(
                        <Tooltip title={"Response status"}>
                          {item.status >= 400 ? (
                            <Tag color="error">{item.status}</Tag>
                          ) : (
                            <span className={styles.delay}>{item.status}</span>
                          )}
                        </Tooltip>,
                      );
                    }
                    if (item.custom) {
                      actions.push(
                        <CleanConfirm
                          onConfirm={() => handleCleanCustom(item)}
                          disabled={item.type === "handled"}
                        >
                          <Tooltip
                            title={"Custom response"}
                            placement="topRight"
                          >
                            <InfoCircleTwoTone />
                          </Tooltip>
                        </CleanConfirm>,
                      );
                    }
                    actions.push(
                      <Dropdown
                        menu={{
                          items: menuItems,
                          onClick: handleClick,
                        }}
                        trigger={["click"]}
                      >
                        <SettingTwoTone />
                      </Dropdown>,
                    );
                    let badgeIcon = null;
                    switch (item.type) {
                      case "handled":
                        badgeIcon = <BulbTwoTone className={styles.badge} />;
                        break;
                      case "manual":
                        badgeIcon = <EditTwoTone className={styles.badge} />;
                        break;
                    }
                    return (
                      <List.Item actions={actions}>
                        <Checkbox
                          checked={item.checked}
                          onChange={() => handleChangeActive(item)}
                        >
                          <Badge count={badgeIcon} color={"blue"}>
                            <Tag
                              color={item.color || getMethodColor(item.method)}
                            >
                              {item.method.toUpperCase()}
                            </Tag>
                          </Badge>{" "}
                          {item.path}
                        </Checkbox>
                      </List.Item>
                    );
                  }}
                />
              ),
            }))}
          />
          <EditDrawer
            ref={editRouteDrawerRef}
            groups={routesByGroup.captions.filter(
              (v) => ["handled", "undefined"].indexOf(v) === -1,
            )}
          />
        </Drawer>
      );
    },
  ),
);
