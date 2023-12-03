import {
  Title,
  Subtitle,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  Button,
} from "@tremor/react";
import Loading from "app/loading";
import useSWR, { mutate } from "swr";
import { getApiURL } from "utils/apiUrl";
import { fetcher } from "utils/fetcher";
import Image from "next/image";
import { User } from "./models";
import UsersMenu from "./users-menu";
import { User as AuthUser } from "next-auth";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { AuthenticationType } from "utils/authenticationType";

interface Props {
  accessToken: string;
  currentUser?: AuthUser;
  selectedTab: string;
}
interface Config {
  AUTH_TYPE: string;
}

export default function UsersSettings({
  accessToken,
  currentUser,
  selectedTab,
}: Props) {
  const apiUrl = getApiURL();
  const { data, error, isLoading } = useSWR<User[]>(
    selectedTab === "users" ? `${apiUrl}/settings/users` : null,
    (url) => fetcher(url, accessToken),
    { revalidateOnFocus: false }
  );

  const { data: configData } = useSWR<Config>("/api/config", fetcher, {
    revalidateOnFocus: false,
  });

  // Determine runtime configuration
  const authType = configData?.AUTH_TYPE;

  if (!data || isLoading) return <Loading />;

  async function addUser() {
    let email;
    let password;
    if (authType == AuthenticationType.SINGLE_TENANT) {
      email = prompt("Enter the user name");
      password = prompt("Enter the user password");
    } else if (authType == AuthenticationType.MULTI_TENANT) {
      email = prompt("Enter the user email");
      password = "";
    } else {
      alert(
        "Keep cannot add users on NO_AUTH mode. To add users, please set Keep AUTH_TYPE environment variable to either SINGLE_TENANT or MULTI_TENANT"
      );
    }
    console.log(email);
    if (email) {
      const response = await fetch(`${apiUrl}/settings/users/${email}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        mutate(`${apiUrl}/settings/users`);
      }
    }
  }

  return (
    <div className="mt-10">
      <div className="flex justify-between">
        <div className="flex flex-col">
          <Title>Users Management</Title>
          <Subtitle>Add or remove users from your tenant</Subtitle>
        </div>
        <div>
          <Button
            color="orange"
            size="md"
            icon={UserPlusIcon}
            onClick={() => addUser()}
          >
            Add User
          </Button>
        </div>
      </div>
      <Card className="mt-2.5">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{/** Image */}</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell className="text-right">Name</TableHeaderCell>
              <TableHeaderCell className="text-right">
                Created At
              </TableHeaderCell>
              <TableHeaderCell className="text-right">
                Last Login
              </TableHeaderCell>
              <TableHeaderCell>{/**Menu */}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((user) => (
              <TableRow
                key={user.name}
                className={`${
                  user.email === currentUser?.email ? "bg-orange-50" : null
                }`}
              >
                <TableCell>
                  {user.picture && (
                    <Image
                      src={user.picture}
                      alt="user picture"
                      className="rounded-full"
                      width={24}
                      height={24}
                    />
                  )}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="text-right">
                  <Text>{user.name}</Text>
                </TableCell>
                <TableCell className="text-right">
                  <Text>{user.created_at}</Text>
                </TableCell>
                <TableCell className="text-right">
                  <Text>{user.last_login}</Text>
                </TableCell>
                <TableCell>
                  <UsersMenu user={user} currentUser={currentUser} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
