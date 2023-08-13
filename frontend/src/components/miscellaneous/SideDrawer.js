import { Box, Button, Tooltip, Text, Menu, MenuButton, Avatar, MenuList, MenuItem, MenuDivider, Drawer, DrawerOverlay, DrawerHeader, DrawerContent, DrawerBody, Input, useToast, Spinner} from '@chakra-ui/react';
import React, {useState } from 'react';
import {BellIcon, ChevronDownIcon} from "@chakra-ui/icons";
import { ChatState } from '../../Context/ChatProvider';
import ProfileModal from './ProfileModal';
import { useNavigate} from 'react-router-dom';
import { useDisclosure } from '@chakra-ui/react';
import axios from 'axios';
import ChatLoading from '../ChatLoading';
import UserListItem from '../UseAvatar/UserListItem';
import { getSender } from '../../config/Chatlogics';

export default function SideDrawer() {
  // search variable will store the value inserted in the input field
  const [search, setSearch] = useState("");

  // searchResule variable will store the value that will come after the searching (initially empty array - because multiple users are possible)
  const [searchResult, setSearchResult] = useState([]);

  // loading variable will set to show animations in GO(search button)
  const [loading, setLoading] = useState(false);


  const [loadingChat, setLoadingChat] = useState();


  const {user,selectedChat,  setSelectedChat, chats, setChats , notification , setNotification} = ChatState();

  const Navigate = useNavigate();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const logoutHandler = ()=>{
    localStorage.removeItem("userInfo");
    Navigate("/");
  };

  const toast = useToast();
  const handleSearch = async()=>{
    if(!search){
      toast({
        title: "Please Enter something is search",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }
    try {
      setLoading(true);
      const config = {
        headers:{
          Authorization: `Bearer ${user.token}`,
        },
      };
      const {data} = await axios.get(`/api/user?search=${search}`, config);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  const accessChat = async(userId)=>{
    try {
      setLoadingChat(true);
      const config = {
        headers: {
          "Content-type" : "application/json",
          Authorization : `Bearer ${user.token}`,
        },
      };

      const {data} = await axios.post("/api/chat", {userId}, config);
      if(!chats.find((c)=> c._id=== data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      setLoadingChat(false);
      onClose();
    } catch (error) {
      toast({
        title: "Error Fetching the chat",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  }

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bg="white"
        w="100%"
        p="5px 10px 5px 10px"
        borderWidth="5px"
      >
        <Tooltip label="Search Users to chat" hasArrow placement = 'bottom-end'>
          <Button variant="ghost" onClick={onOpen}>
            <i className="fas fa-search"></i>
            <Text display={{base : "none", md: 'flex'}} px = '4'>
              Search User
            </Text>
          </Button>
        </Tooltip>
        <Text fontSize="2x1" fontFamily="Work sans">Chat App</Text>
        <div>
          <Menu>
            <MenuButton p="1">
            {notification.length ? notification.length: <></>}
              <BellIcon fontSize="2x1" m = "1"/>
            </MenuButton>
            <MenuList>
              {!notification.length && "No New Message"}
              {notification.map(notif =>(
                <MenuItem key = {notif._id} onClick={()=>{
                  setSelectedChat(notif.chat);
                  setNotification(notification.filter((n)=>n !== notif))
                }}>
                  {notif.chat.isGroupChat ? `New Message in ${notif.chat.chatName}` :
                  `New message from ${getSender(user, notif.chat.users)}`}
                </MenuItem>
              ))}
            </MenuList>

          </Menu>
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon/>}>
              <Avatar size="sm" cursor="pointer" name={user.name} src={user.pic}/>
            </MenuButton>
            <MenuList>
              <ProfileModal user={user}>
              <MenuItem>My Profile</MenuItem>
              </ProfileModal>
              <MenuDivider/>
              <MenuItem onClick={logoutHandler}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </div>
      </Box>
      <Drawer placement='left' onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay/>
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">Search Users</DrawerHeader>
          <DrawerBody>
            <Box
              display="flex"
              pb={2}
            >
            <Input
              placeholder='Search by name or email'
              mr={2}
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
            />
            <Button onClick={handleSearch} isLoading={loading}>Go</Button>
            </Box>
            {
              loading ? (
                <ChatLoading/>
              ) : (
                searchResult?.map((users) =>(
                  <UserListItem
                    key = {users._id}
                    user = {users}
                    handleFunction = {()=> accessChat(users._id)}
                  />
                ))
              )}
              {loadingChat && <Spinner ml="auto" display="flex" />}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
